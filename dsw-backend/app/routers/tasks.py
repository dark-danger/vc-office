from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, inspect, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.all_models import User, UserRole, Task, TaskSubmission, TaskStatus, FacultyPerformanceLedger, Event, Department
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskOut, TaskSubmissionCreate, TaskReviewPayload
from app.core.scoring_rules import calculate_faculty_task_score, FACULTY_SCORE_DECLINED
from app.services.notification_service import create_notification, log_audit
from app.core.cache import ttl_cache

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

def build_task_out(t: Task) -> TaskOut:
    state = inspect(t)
    
    submissions_out = []
    if "submissions" not in state.unloaded and t.submissions:
        for s in t.submissions:
            s_state = inspect(s)
            submitter_val = s.submitter if "submitter" not in s_state.unloaded else None
            submissions_out.append({
                "id": s.id,
                "task_id": s.task_id,
                "submitted_by": s.submitted_by,
                "submitter": submitter_val,
                "description": s.description,
                "file_url": s.file_url,
                "file_type": s.file_type,
                "file_name": s.file_name,
                "file_size": s.file_size,
                "submitted_at": s.submitted_at,
                "review_status": s.review_status,
                "reviewed_by": s.reviewed_by,
                "review_remarks": s.review_remarks,
                "reviewed_at": s.reviewed_at
            })

    subtasks_out = []
    if "subtasks" not in state.unloaded and hasattr(t, "subtasks") and t.subtasks:
        for st in t.subtasks:
            subtasks_out.append(build_task_out(st))

    event_title = None
    if "event" not in state.unloaded and t.event:
        event_title = t.event.title

    assignee_val = None
    if "assignee" not in state.unloaded and t.assignee:
        assignee_val = t.assignee

    dept_name = None
    if "department" not in state.unloaded and getattr(t, "department", None):
        dept_name = t.department.name

    return TaskOut(
        id=t.id,
        title=t.title,
        description=t.description,
        task_type=t.task_type,
        event_id=t.event_id,
        event_title=event_title,
        parent_task_id=t.parent_task_id,
        department_id=getattr(t, "department_id", None),
        department_name=dept_name,
        target_scope=getattr(t, "target_scope", "individual") or "individual",
        assigned_by_role=getattr(t, "assigned_by_role", "super_admin") or "super_admin",
        points_reward=getattr(t, "points_reward", 10) or 10,
        assigned_to=t.assigned_to,
        assignee=assignee_val,
        assigned_by=t.assigned_by,
        start_date=t.start_date if hasattr(t, "start_date") else None,
        due_date=t.due_date,
        priority=t.priority,
        status=t.status,
        created_at=t.created_at,
        submissions=submissions_out,
        subtasks=subtasks_out
    )

@router.post("", response_model=TaskOut)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head, UserRole.faculty])),
    db: AsyncSession = Depends(get_db)
):
    parent_task = None
    if payload.parent_task_id:
        p_res = await db.execute(select(Task).where(Task.id == payload.parent_task_id))
        parent_task = p_res.scalar_one_or_none()
        if not parent_task:
            raise HTTPException(status_code=404, detail="Parent task not found")

    # --- 1. FACULTY ROLE ---
    if current_user.role == UserRole.faculty:
        if parent_task:
            if parent_task.assigned_to != current_user.id:
                raise HTTPException(status_code=403, detail="You can only add subtasks to tasks assigned to you")
            assigned_to = parent_task.assigned_to
            event_id = payload.event_id if payload.event_id is not None else parent_task.event_id
            task_type = "subtask"
        else:
            now_utc = datetime.now(timezone.utc)
            twenty_four_hours_ago = now_utc - timedelta(hours=24)
            last_self_res = await db.execute(
                select(Task)
                .where(
                    Task.assigned_by == current_user.id,
                    Task.assigned_to == current_user.id,
                    Task.parent_task_id.is_(None),
                    Task.created_at >= twenty_four_hours_ago
                )
                .order_by(Task.created_at.desc())
            )
            last_self_task = last_self_res.scalars().first()
            if last_self_task:
                created_t = last_self_task.created_at
                if created_t.tzinfo is None:
                    created_t = created_t.replace(tzinfo=timezone.utc)
                next_allowed = created_t + timedelta(hours=24)
                rem_seconds = max(0, int((next_allowed - now_utc).total_seconds()))
                if rem_seconds > 0:
                    rem_h = rem_seconds // 3600
                    rem_m = (rem_seconds % 3600) // 60
                    time_str = f"{rem_h}h {rem_m}m" if rem_h > 0 else f"{rem_m}m"
                    raise HTTPException(
                        status_code=429,
                        detail=f"Daily Limit: You can only propose 1 self-created task every 24 hours. Next task proposal available in {time_str}."
                    )

            assigned_to = current_user.id
            event_id = payload.event_id
            task_type = payload.task_type or "self_created"

        assigned_by = current_user.id
        initial_status = TaskStatus.submitted

        task = Task(
            title=payload.title,
            description=payload.description,
            task_type=task_type,
            event_id=event_id,
            parent_task_id=payload.parent_task_id,
            department_id=current_user.department_id,
            target_scope="individual",
            assigned_by_role="faculty",
            points_reward=payload.points_reward or 10,
            assigned_to=assigned_to,
            assigned_by=assigned_by,
            start_date=payload.start_date,
            due_date=payload.due_date,
            priority=payload.priority,
            status=initial_status
        )
        db.add(task)
        await db.flush()

        submission = TaskSubmission(
            task_id=task.id,
            submitted_by=current_user.id,
            description=payload.description or ("Faculty subtask submission" if parent_task else "Faculty self-created task submission"),
            file_url=payload.file_url,
            file_name=payload.file_name,
            file_type=payload.file_type,
            file_size=payload.file_size,
            review_status="pending"
        )
        db.add(submission)
        await db.commit()

        # Re-query task with relations
        res = await db.execute(
            select(Task)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.department),
                selectinload(Task.event),
                selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
                selectinload(Task.subtasks).selectinload(Task.assignee),
                selectinload(Task.subtasks).selectinload(Task.event),
                selectinload(Task.subtasks).selectinload(Task.submissions)
            )
            .where(Task.id == task.id)
        )
        created_task = res.scalar_one()

        # Notify VC Office
        admin_res = await db.execute(select(User).where(User.role == UserRole.super_admin))
        admins = admin_res.scalars().all()
        for admin in admins:
            await create_notification(
                db,
                title=f"New Task Request 📋",
                body=f"Faculty {current_user.name} submitted task: '{task.title}' for approval",
                type="task_request",
                user_id=admin.id,
                link="/admin/requests"
            )

        if current_user.department_id:
            dept_res = await db.execute(select(Department).where(Department.id == current_user.department_id))
            dept = dept_res.scalar_one_or_none()
            if dept and dept.head_id and dept.head_id != current_user.id:
                await create_notification(
                    db,
                    title=f"Faculty Task Submitted 📋",
                    body=f"Department faculty {current_user.name} submitted task: '{task.title}'",
                    type="task_request",
                    user_id=dept.head_id,
                    link="/head/tasks"
                )

        await log_audit(db, action="CREATE_FACULTY_TASK_REQUEST", entity_type="task", actor_id=current_user.id, entity_id=task.id, meta={"title": task.title, "faculty": current_user.name})
        await db.commit()

        ttl_cache.invalidate("dashboard_")
        ttl_cache.invalidate("lb_staff_")
        ttl_cache.invalidate("dept_leaderboard")

        return build_task_out(created_task)

    # --- 2. DEPARTMENT HEAD ROLE ---
    elif current_user.role == UserRole.department_head:
        dept_id = current_user.department_id
        if not dept_id:
            dept_res = await db.execute(select(Department).where(Department.head_id == current_user.id))
            dept = dept_res.scalar_one_or_none()
            if dept:
                dept_id = dept.id
        
        # If head is assigning to a faculty member
        if payload.assigned_to and payload.assigned_to != current_user.id:
            fac_res = await db.execute(
                select(User).where(User.id == payload.assigned_to, User.role == UserRole.faculty)
            )
            faculty = fac_res.scalar_one_or_none()
            if not faculty:
                raise HTTPException(status_code=400, detail="Assigned user must be a registered faculty member")
            
            task = Task(
                title=payload.title,
                description=payload.description,
                task_type=payload.task_type or "department_delegation",
                event_id=payload.event_id,
                parent_task_id=payload.parent_task_id,
                department_id=dept_id,
                target_scope="faculty",
                assigned_by_role="department_head",
                points_reward=payload.points_reward or 10,
                assigned_to=faculty.id,
                assigned_by=current_user.id,
                start_date=payload.start_date,
                due_date=payload.due_date,
                priority=payload.priority,
                status=TaskStatus.pending
            )
            db.add(task)
            await db.commit()

            await create_notification(
                db,
                title=f"New Task from Department Head 📋",
                body=f"HOD {current_user.name} assigned you: '{task.title}'",
                type="task_assigned",
                user_id=faculty.id,
                link="/faculty/tasks"
            )
            await log_audit(db, action="HOD_DELEGATE_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id, meta={"title": task.title, "assignee": faculty.name})
            await db.commit()

        else:
            # Department Head submitting a departmental deliverable / proposal to VC Office
            task = Task(
                title=payload.title,
                description=payload.description,
                task_type=payload.task_type or "department_deliverable",
                event_id=payload.event_id,
                parent_task_id=payload.parent_task_id,
                department_id=dept_id,
                target_scope="department",
                assigned_by_role="department_head",
                points_reward=payload.points_reward or 15,
                assigned_to=current_user.id,
                assigned_by=current_user.id,
                start_date=payload.start_date,
                due_date=payload.due_date,
                priority=payload.priority,
                status=TaskStatus.submitted
            )
            db.add(task)
            await db.flush()

            if payload.file_url or payload.description:
                submission = TaskSubmission(
                    task_id=task.id,
                    submitted_by=current_user.id,
                    description=payload.description or "Department deliverable submission",
                    file_url=payload.file_url,
                    file_name=payload.file_name,
                    file_type=payload.file_type,
                    file_size=payload.file_size,
                    review_status="pending"
                )
                db.add(submission)
            await db.commit()

            # Notify VC Admins
            admin_res = await db.execute(select(User).where(User.role == UserRole.super_admin))
            admins = admin_res.scalars().all()
            for admin in admins:
                await create_notification(
                    db,
                    title=f"New Department Deliverable 🏛️",
                    body=f"HOD {current_user.name} submitted: '{task.title}' for VC Office review",
                    type="task_request",
                    user_id=admin.id,
                    link="/admin/requests"
                )
            await db.commit()

        # Re-query task with relations
        res = await db.execute(
            select(Task)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.department),
                selectinload(Task.event),
                selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
                selectinload(Task.subtasks).selectinload(Task.assignee),
                selectinload(Task.subtasks).selectinload(Task.event),
                selectinload(Task.subtasks).selectinload(Task.submissions)
            )
            .where(Task.id == task.id)
        )
        created_task = res.scalar_one()

        ttl_cache.invalidate("dashboard_")
        ttl_cache.invalidate("lb_staff_")
        ttl_cache.invalidate("dept_leaderboard")
        return build_task_out(created_task)

    # --- 3. SUPER ADMIN (VC OFFICE) ---
    else:
        assigned_to = payload.assigned_to
        dept_id = payload.department_id

        if dept_id and not assigned_to:
            dept_res = await db.execute(select(Department).where(Department.id == dept_id))
            dept = dept_res.scalar_one_or_none()
            if dept and dept.head_id:
                assigned_to = dept.head_id
            elif dept:
                fac_res = await db.execute(select(User).where(User.department_id == dept_id).limit(1))
                any_user = fac_res.scalar_one_or_none()
                if any_user:
                    assigned_to = any_user.id

        if not assigned_to:
            raise HTTPException(status_code=400, detail="Assigned recipient (or target department with assigned Head/Faculty) must be specified")

        target_user_res = await db.execute(select(User).where(User.id == assigned_to))
        target_user = target_user_res.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=400, detail="Assigned user not found")

        if not dept_id and target_user.department_id:
            dept_id = target_user.department_id

        task = Task(
            title=payload.title,
            description=payload.description,
            task_type=payload.task_type or "standalone",
            event_id=payload.event_id,
            parent_task_id=payload.parent_task_id,
            department_id=dept_id,
            target_scope=payload.target_scope or ("department" if target_user.role == UserRole.department_head else "individual"),
            assigned_by_role="super_admin",
            points_reward=payload.points_reward or 10,
            assigned_to=assigned_to,
            assigned_by=current_user.id,
            start_date=payload.start_date,
            due_date=payload.due_date,
            priority=payload.priority,
            status=TaskStatus.pending
        )
        db.add(task)
        await db.commit()

        # Re-query task with relations
        res = await db.execute(
            select(Task)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.department),
                selectinload(Task.event),
                selectinload(Task.submissions),
                selectinload(Task.subtasks).selectinload(Task.assignee),
                selectinload(Task.subtasks).selectinload(Task.event),
                selectinload(Task.subtasks).selectinload(Task.submissions)
            )
            .where(Task.id == task.id)
        )
        created_task = res.scalar_one()

        dest_route = "/head/tasks" if target_user.role == UserRole.department_head else "/faculty/tasks"
        await create_notification(
            db,
            title=f"New Task from VC Office 🏛️",
            body=f"You have been assigned: '{task.title}'",
            type="task_assigned",
            user_id=target_user.id,
            link=dest_route
        )
        await log_audit(db, action="VC_CREATE_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id, meta={"title": task.title, "assignee": target_user.name, "dept_id": dept_id})
        await db.commit()

        ttl_cache.invalidate("dashboard_")
        ttl_cache.invalidate("lb_staff_")
        ttl_cache.invalidate("dept_leaderboard")

        return build_task_out(created_task)


@router.get("/requests", response_model=List[TaskOut])
async def list_task_requests(
    status_filter: Optional[str] = None,
    type_filter: Optional[str] = None,
    department_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    faculty_name: Optional[str] = None,
    event_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.department),
        selectinload(Task.event),
        selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
        selectinload(Task.subtasks).selectinload(Task.assignee),
        selectinload(Task.subtasks).selectinload(Task.event),
        selectinload(Task.subtasks).selectinload(Task.submissions).selectinload(TaskSubmission.submitter)
    )

    if current_user.role == UserRole.department_head:
        # Dept head sees requests from their department faculties or tasks they assigned
        dept_id = current_user.department_id
        if not dept_id:
            dept_res = await db.execute(select(Department).where(Department.head_id == current_user.id))
            dept = dept_res.scalar_one_or_none()
            if dept:
                dept_id = dept.id
        
        if dept_id:
            query = query.where(or_(Task.department_id == dept_id, Task.assigned_by == current_user.id))
        else:
            query = query.where(Task.assigned_by == current_user.id)
    elif department_id:
        query = query.where(Task.department_id == department_id)

    if faculty_id:
        query = query.where(Task.assigned_to == faculty_id)

    if event_id:
        query = query.where(Task.event_id == event_id)

    if type_filter == "self_created":
        query = query.where(Task.assigned_by == Task.assigned_to)
    elif type_filter == "assigned_duty":
        query = query.where(Task.assigned_by != Task.assigned_to)

    if priority:
        query = query.where(Task.priority == priority)

    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.where((Task.due_date >= from_dt) | (Task.start_date >= from_dt) | (Task.created_at >= from_dt))
        except Exception:
            pass

    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.where((Task.due_date <= to_dt) | (Task.start_date <= to_dt) | (Task.created_at <= to_dt))
        except Exception:
            pass

    if status_filter and status_filter != "all":
        if status_filter == "pending":
            query = query.where(Task.status.in_([TaskStatus.pending, TaskStatus.submitted]))
        elif status_filter == "submitted":
            query = query.where(Task.status == TaskStatus.submitted)
        elif status_filter == "approved":
            query = query.where(Task.status == TaskStatus.approved)
        elif status_filter == "declined":
            query = query.where(Task.status == TaskStatus.declined)
        else:
            query = query.where(Task.status == status_filter)

    if faculty_name:
        query = query.join(Task.assignee).where(User.name.ilike(f"%{faculty_name}%"))

    if search:
        query = query.where(Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Task.created_at.desc()))
    tasks = result.scalars().all()
    return [build_task_out(t) for t in tasks]


@router.get("", response_model=List[TaskOut])
async def list_tasks(
    assigned_to: Optional[int] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    event_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.department),
        selectinload(Task.event),
        selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
        selectinload(Task.subtasks).selectinload(Task.assignee),
        selectinload(Task.subtasks).selectinload(Task.event),
        selectinload(Task.subtasks).selectinload(Task.submissions).selectinload(TaskSubmission.submitter)
    )

    if current_user.role == UserRole.faculty:
        query = query.where(Task.assigned_to == current_user.id)
    elif current_user.role == UserRole.department_head:
        dept_id = current_user.department_id
        if not dept_id:
            dept_res = await db.execute(select(Department).where(Department.head_id == current_user.id))
            dept = dept_res.scalar_one_or_none()
            if dept:
                dept_id = dept.id
        
        if dept_id:
            query = query.where(
                or_(
                    Task.assigned_to == current_user.id,
                    Task.assigned_by == current_user.id,
                    Task.department_id == dept_id
                )
            )
        else:
            query = query.where(
                or_(
                    Task.assigned_to == current_user.id,
                    Task.assigned_by == current_user.id
                )
            )
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
    else:
        # Super Admin
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        if department_id:
            query = query.where(Task.department_id == department_id)

    if status_filter:
        query = query.where(Task.status == status_filter)
    if event_id:
        query = query.where(Task.event_id == event_id)
    if priority:
        query = query.where(Task.priority == priority)

    if from_date:
        try:
            from_dt = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.where((Task.due_date >= from_dt) | (Task.start_date >= from_dt) | (Task.created_at >= from_dt))
        except Exception:
            pass

    if to_date:
        try:
            to_dt = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.where((Task.due_date <= to_dt) | (Task.start_date <= to_dt) | (Task.created_at <= to_dt))
        except Exception:
            pass

    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Task.created_at.desc()))
    tasks = result.scalars().all()

    top_tasks = [t for t in tasks if t.parent_task_id is None] if not search else tasks
    return [build_task_out(t) for t in top_tasks]


@router.get("/mine", response_model=List[TaskOut])
async def get_my_tasks(
    current_user: User = Depends(require_role([UserRole.faculty, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.department),
            selectinload(Task.event), 
            selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
            selectinload(Task.subtasks).selectinload(Task.assignee),
            selectinload(Task.subtasks).selectinload(Task.event),
            selectinload(Task.subtasks).selectinload(Task.submissions).selectinload(TaskSubmission.submitter)
        )
        .where(Task.assigned_to == current_user.id, Task.parent_task_id.is_(None))
        .order_by(Task.created_at.desc())
    )
    tasks = result.scalars().all()
    return [build_task_out(t) for t in tasks]


@router.get("/self-create-limit")
async def get_self_create_limit(
    current_user: User = Depends(require_role([UserRole.faculty])),
    db: AsyncSession = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc)
    twenty_four_hours_ago = now_utc - timedelta(hours=24)
    
    last_self_res = await db.execute(
        select(Task)
        .where(
            Task.assigned_by == current_user.id,
            Task.assigned_to == current_user.id,
            Task.parent_task_id.is_(None),
            Task.created_at >= twenty_four_hours_ago
        )
        .order_by(Task.created_at.desc())
    )
    last_self_task = last_self_res.scalars().first()
    
    if not last_self_task:
        return {
            "can_create": True,
            "seconds_remaining": 0,
            "next_allowed_at": None,
            "time_remaining_str": None,
            "message": "You can propose a self-created task."
        }
    
    created_t = last_self_task.created_at
    if created_t.tzinfo is None:
        created_t = created_t.replace(tzinfo=timezone.utc)
    next_allowed = created_t + timedelta(hours=24)
    rem_seconds = max(0, int((next_allowed - now_utc).total_seconds()))
    can_create = (rem_seconds <= 0)
    
    rem_h = rem_seconds // 3600
    rem_m = (rem_seconds % 3600) // 60
    time_str = f"{rem_h}h {rem_m}m" if rem_h > 0 else f"{rem_m}m"
    
    return {
        "can_create": can_create,
        "seconds_remaining": rem_seconds,
        "next_allowed_at": next_allowed.isoformat(),
        "time_remaining_str": time_str if not can_create else None,
        "last_task_id": last_self_task.id,
        "last_task_title": last_self_task.title,
        "message": f"Daily Limit: 1 task proposal per 24 hours. Next available in {time_str}." if not can_create else "You can propose a self-created task."
    }


@router.get("/{task_id}", response_model=TaskOut)
async def get_task_detail(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.department),
            selectinload(Task.event),
            selectinload(Task.submissions).selectinload(TaskSubmission.submitter),
            selectinload(Task.subtasks).selectinload(Task.assignee),
            selectinload(Task.subtasks).selectinload(Task.event),
            selectinload(Task.subtasks).selectinload(Task.submissions)
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == UserRole.faculty and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this task")

    return build_task_out(task)

@router.post("/{task_id}/submit", response_model=TaskOut)
async def submit_task(
    task_id: int,
    payload: TaskSubmissionCreate,
    current_user: User = Depends(require_role([UserRole.faculty, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this task")

    submission = TaskSubmission(
        task_id=task.id,
        submitted_by=current_user.id,
        description=payload.description,
        file_url=payload.file_url,
        file_type=payload.file_type,
        file_name=payload.file_name,
        file_size=payload.file_size,
        review_status="pending"
    )
    db.add(submission)

    task.status = TaskStatus.submitted
    await db.commit()

    # If submitted by Faculty, notify Department Head (if any) and Super Admin
    admin_res = await db.execute(select(User).where(User.role == UserRole.super_admin))
    admins = admin_res.scalars().all()
    item_type = "Subtask" if task.parent_task_id else "Task"
    for admin in admins:
        await create_notification(
            db,
            title=f"{item_type} Submitted for Review 📋",
            body=f"{current_user.name} submitted {item_type.lower()}: '{task.title}'",
            type="task_submitted",
            user_id=admin.id,
            link="/admin/requests"
        )

    if current_user.role == UserRole.faculty and current_user.department_id:
        dept_res = await db.execute(select(Department).where(Department.id == current_user.department_id))
        dept = dept_res.scalar_one_or_none()
        if dept and dept.head_id:
            await create_notification(
                db,
                title=f"Faculty Task Submitted 📋",
                body=f"Faculty {current_user.name} submitted: '{task.title}'",
                type="task_submitted",
                user_id=dept.head_id,
                link="/head/tasks"
            )

    await log_audit(db, action="SUBMIT_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id)
    await db.commit()

    return await get_task_detail(task_id, current_user, db)

@router.post("/{task_id}/approve", response_model=TaskOut)
async def approve_task(
    task_id: int,
    payload: Optional[TaskReviewPayload] = None,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).options(selectinload(Task.submissions)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # If Department Head is approving, verify permission
    if current_user.role == UserRole.department_head:
        dept_id = current_user.department_id
        if not dept_id:
            dept_res = await db.execute(select(Department).where(Department.head_id == current_user.id))
            dept = dept_res.scalar_one_or_none()
            if dept:
                dept_id = dept.id
        if task.assigned_by != current_user.id and task.department_id != dept_id:
            raise HTTPException(status_code=403, detail="You can only approve tasks within your department")

    now = datetime.now(timezone.utc)
    is_late = bool(task.due_date and task.due_date.tzinfo is None and task.due_date < now.replace(tzinfo=None)) or \
              bool(task.due_date and task.due_date.tzinfo is not None and task.due_date < now)

    already_approved = (str(task.status.value if hasattr(task.status, 'value') else task.status) == "approved")

    task.status = TaskStatus.approved

    # Update latest submission review or create one if none exists
    if task.submissions:
        sub = sorted(task.submissions, key=lambda s: s.id)[-1]
        sub.review_status = "approved"
        sub.reviewed_by = current_user.id
        sub.reviewed_at = now
        sub.review_remarks = payload.review_remarks if payload else f"Approved by {current_user.name}"
    else:
        sub = TaskSubmission(
            task_id=task.id,
            submitted_by=task.assigned_to,
            description=task.description or "Approved",
            review_status="approved",
            reviewed_by=current_user.id,
            reviewed_at=now,
            review_remarks=payload.review_remarks if payload else f"Approved by {current_user.name}"
        )
        db.add(sub)

    is_subtask = (task.parent_task_id is not None)
    base_score = calculate_faculty_task_score(is_late)
    score_delta = 0 if is_subtask else (task.points_reward if getattr(task, "points_reward", None) else base_score)

    # Faculty Performance Ledger Entry
    if not already_approved and not is_subtask and task.assigned_to:
        ledger_entry = FacultyPerformanceLedger(
            faculty_id=task.assigned_to,
            score_delta=score_delta,
            source_type="task_approved",
            source_id=task.id,
            note=f"Approved on-time (+{score_delta})" if not is_late else f"Approved late (+{score_delta})"
        )
        db.add(ledger_entry)

    # Credit Department Points
    dept_id = task.department_id
    if not dept_id and task.assigned_to:
        assignee_res = await db.execute(select(User).where(User.id == task.assigned_to))
        u = assignee_res.scalar_one_or_none()
        if u and u.department_id:
            dept_id = u.department_id
    
    if dept_id and not already_approved and not is_subtask:
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept:
            dept.points += score_delta

    await db.commit()

    # Notify faculty member / assignee
    if is_subtask:
        notif_title = "Subtask Approved! 🎉"
        notif_body = f"Your subtask '{task.title}' has been approved."
    else:
        notif_title = "Task Approved! 🎉"
        notif_body = f"Your task '{task.title}' has been approved (+{score_delta} points awarded)."

    await create_notification(
        db,
        title=notif_title,
        body=notif_body,
        type="task_approved",
        user_id=task.assigned_to,
        link=f"/faculty/tasks" if current_user.role == UserRole.super_admin else "/head/tasks"
    )
    await log_audit(db, action="APPROVE_SUBTASK" if is_subtask else "APPROVE_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id, meta={"score_delta": score_delta, "is_subtask": is_subtask, "department_id": dept_id})
    await db.commit()

    ttl_cache.invalidate("dashboard_")
    ttl_cache.invalidate("lb_staff_")
    ttl_cache.invalidate("dept_leaderboard")

    return await get_task_detail(task_id, current_user, db)

@router.post("/{task_id}/decline", response_model=TaskOut)
async def decline_task(
    task_id: int,
    payload: TaskReviewPayload,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    if not payload.review_remarks or not payload.review_remarks.strip():
        raise HTTPException(status_code=400, detail="Mandatory review remarks explaining the rejection must be provided.")

    result = await db.execute(
        select(Task).options(selectinload(Task.submissions)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == UserRole.department_head:
        dept_id = current_user.department_id
        if not dept_id:
            dept_res = await db.execute(select(Department).where(Department.head_id == current_user.id))
            dept = dept_res.scalar_one_or_none()
            if dept:
                dept_id = dept.id
        if task.assigned_by != current_user.id and task.department_id != dept_id:
            raise HTTPException(status_code=403, detail="You can only decline tasks within your department")

    now = datetime.now(timezone.utc)
    task.status = TaskStatus.declined

    if task.submissions:
        sub = sorted(task.submissions, key=lambda s: s.id)[-1]
        sub.review_status = "declined"
        sub.reviewed_by = current_user.id
        sub.reviewed_at = now
        sub.review_remarks = payload.review_remarks
    else:
        sub = TaskSubmission(
            task_id=task.id,
            submitted_by=task.assigned_to,
            description=task.description or "Task proposal",
            review_status="declined",
            reviewed_by=current_user.id,
            reviewed_at=now,
            review_remarks=payload.review_remarks
        )
        db.add(sub)

    is_subtask = (task.parent_task_id is not None)

    # Faculty Performance Ledger Entry (-3 for decline)
    if task.assigned_to:
        ledger_entry = FacultyPerformanceLedger(
            faculty_id=task.assigned_to,
            score_delta=FACULTY_SCORE_DECLINED,
            source_type="subtask_declined" if is_subtask else "task_declined",
            source_id=task.id,
            note=f"Declined ({FACULTY_SCORE_DECLINED})"
        )
        db.add(ledger_entry)
    await db.commit()

    item_label = "subtask" if is_subtask else "task"
    await create_notification(
        db,
        title=f"{item_label.title()} Declined (-3 pts)",
        body=f"Your {item_label} '{task.title}' was declined. Remark: '{payload.review_remarks}'",
        type="task_declined",
        user_id=task.assigned_to,
        link="/faculty/tasks"
    )
    await log_audit(db, action="DECLINE_SUBTASK" if is_subtask else "DECLINE_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id, meta={"remarks": payload.review_remarks, "score_delta": FACULTY_SCORE_DECLINED, "is_subtask": is_subtask})
    await db.commit()

    ttl_cache.invalidate("dashboard_")
    ttl_cache.invalidate("lb_staff_")
    ttl_cache.invalidate("dept_leaderboard")

    return await get_task_detail(task_id, current_user, db)

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_assignee = task.assigned_to
    data = payload.model_dump(exclude_unset=True)

    if task.parent_task_id is not None and "assigned_to" in data and data["assigned_to"] is not None:
        p_res = await db.execute(select(Task).where(Task.id == task.parent_task_id))
        parent_task = p_res.scalar_one_or_none()
        if parent_task and data["assigned_to"] != parent_task.assigned_to:
            raise HTTPException(status_code=400, detail="Subtask assignee is locked to the parent task assignee and cannot be changed independently.")

    for key, value in data.items():
        setattr(task, key, value)

    await db.commit()

    if task.parent_task_id is None and "assigned_to" in data and data["assigned_to"] != old_assignee:
        from sqlalchemy import update
        await db.execute(
            update(Task).where(Task.parent_task_id == task.id).values(assigned_to=data["assigned_to"])
        )
        await db.commit()

    if "assigned_to" in data and data["assigned_to"] != old_assignee:
        await create_notification(
            db,
            title="Task Re-assigned to You",
            body=f"You have been assigned task: '{task.title}'",
            type="task_assigned",
            user_id=task.assigned_to,
            link="/faculty/tasks"
        )
        await db.commit()

    await log_audit(db, action="UPDATE_TASK", entity_type="task", actor_id=current_user.id, entity_id=task.id)
    await db.commit()

    ttl_cache.invalidate("dashboard_")
    ttl_cache.invalidate("lb_staff_")
    ttl_cache.invalidate("dept_leaderboard")

    return await get_task_detail(task_id, current_user, db)

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(require_role([UserRole.super_admin, UserRole.department_head])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await db.delete(task)
    await db.commit()

    ttl_cache.invalidate("dashboard_")
    ttl_cache.invalidate("lb_staff_")
    ttl_cache.invalidate("dept_leaderboard")

    return {"message": "Task deleted successfully"}
