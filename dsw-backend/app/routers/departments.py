import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, text
from typing import List, Optional

from app.database import get_db
from app.models.all_models import Department, User, UserRole, Task, TaskStatus
from app.schemas.schemas import (
    DepartmentOut, DepartmentHeadAssign, BulkFacultyRequest,
    BulkFacultyResponse, FacultyCredentialItem, UserOut
)
from app.core.deps import get_current_active_user, get_current_super_admin
from app.core.security import get_password_hash

router = APIRouter(prefix="/api/departments", tags=["Departments & 3-Way Governance"])

@router.get("", response_model=List[DepartmentOut])
async def get_all_departments(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all university departments with HOD details, faculty count, and task statistics."""
    query = select(Department).order_by(Department.category, Department.name)
    if category:
        query = query.filter(Department.category == category)
    
    res = await db.execute(query)
    depts = res.scalars().all()

    # Pre-fetch counts for scale
    dept_ids = [d.id for d in depts]
    
    # 1. Faculty count per department
    faculty_count_q = (
        select(User.department_id, func.count(User.id))
        .filter(User.department_id.in_(dept_ids), User.is_active == True)
        .group_by(User.department_id)
    )
    fc_res = await db.execute(faculty_count_q)
    fc_map = dict(fc_res.fetchall())

    # 2. Completed tasks per department
    completed_tasks_q = (
        select(Task.department_id, func.count(Task.id))
        .filter(Task.department_id.in_(dept_ids), Task.status == TaskStatus.approved)
        .group_by(Task.department_id)
    )
    ct_res = await db.execute(completed_tasks_q)
    ct_map = dict(ct_res.fetchall())

    # 3. Pending tasks per department
    pending_tasks_q = (
        select(Task.department_id, func.count(Task.id))
        .filter(Task.department_id.in_(dept_ids), Task.status.in_([TaskStatus.pending, TaskStatus.in_progress, TaskStatus.submitted]))
        .group_by(Task.department_id)
    )
    pt_res = await db.execute(pending_tasks_q)
    pt_map = dict(pt_res.fetchall())

    # Fetch head users
    head_ids = [d.head_id for d in depts if d.head_id is not None]
    heads_map = {}
    if head_ids:
        heads_q = select(User).filter(User.id.in_(head_ids))
        h_res = await db.execute(heads_q)
        heads_map = {u.id: u for u in h_res.scalars().all()}

    output = []
    for d in depts:
        head_user = heads_map.get(d.head_id)
        output.append(
            DepartmentOut(
                id=d.id,
                name=d.name,
                code=d.code,
                category=d.category,
                head_id=d.head_id,
                head=UserOut.model_validate(head_user) if head_user else None,
                description=d.description,
                points=d.points or 0,
                faculty_count=fc_map.get(d.id, 0),
                completed_tasks_count=ct_map.get(d.id, 0),
                pending_tasks_count=pt_map.get(d.id, 0),
                is_active=d.is_active,
                created_at=d.created_at
            )
        )
    return output


@router.get("/leaderboard")
async def get_departments_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Department Leaderboard ranked by total points, task completion count, and performance rate."""
    query = select(Department).filter(Department.is_active == True).order_by(desc(Department.points))
    res = await db.execute(query)
    depts = res.scalars().all()

    dept_ids = [d.id for d in depts]
    # Counts
    fc_res = await db.execute(select(User.department_id, func.count(User.id)).filter(User.department_id.in_(dept_ids)).group_by(User.department_id))
    fc_map = dict(fc_res.fetchall())

    ct_res = await db.execute(select(Task.department_id, func.count(Task.id)).filter(Task.department_id.in_(dept_ids), Task.status == TaskStatus.approved).group_by(Task.department_id))
    ct_map = dict(ct_res.fetchall())

    total_tasks_res = await db.execute(select(Task.department_id, func.count(Task.id)).filter(Task.department_id.in_(dept_ids)).group_by(Task.department_id))
    tt_map = dict(total_tasks_res.fetchall())

    head_ids = [d.head_id for d in depts if d.head_id is not None]
    heads_map = {}
    if head_ids:
        h_res = await db.execute(select(User).filter(User.id.in_(head_ids)))
        heads_map = {u.id: u for u in h_res.scalars().all()}

    ranked = []
    for rank, d in enumerate(depts, 1):
        completed = ct_map.get(d.id, 0)
        total = tt_map.get(d.id, 0)
        rate = round((completed / total * 100) if total > 0 else 100.0, 1)
        head_user = heads_map.get(d.head_id)
        ranked.append({
            "rank": rank,
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "category": d.category,
            "points": d.points or 0,
            "faculty_count": fc_map.get(d.id, 0),
            "completed_tasks": completed,
            "total_tasks": total,
            "completion_rate": rate,
            "head_name": head_user.name if head_user else "Not Assigned",
            "head_email": head_user.email if head_user else None
        })
    return ranked


@router.get("/{id}", response_model=DepartmentOut)
async def get_department_details(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get single department details."""
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    fc_res = await db.execute(select(func.count(User.id)).filter(User.department_id == dept.id, User.is_active == True))
    faculty_count = fc_res.scalar() or 0

    ct_res = await db.execute(select(func.count(Task.id)).filter(Task.department_id == dept.id, Task.status == TaskStatus.approved))
    completed_count = ct_res.scalar() or 0

    pt_res = await db.execute(select(func.count(Task.id)).filter(Task.department_id == dept.id, Task.status.in_([TaskStatus.pending, TaskStatus.in_progress, TaskStatus.submitted])))
    pending_count = pt_res.scalar() or 0

    head_user = None
    if dept.head_id:
        head_user = await db.get(User, dept.head_id)

    return DepartmentOut(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        category=dept.category,
        head_id=dept.head_id,
        head=UserOut.model_validate(head_user) if head_user else None,
        description=dept.description,
        points=dept.points or 0,
        faculty_count=faculty_count,
        completed_tasks_count=completed_count,
        pending_tasks_count=pending_count,
        is_active=dept.is_active,
        created_at=dept.created_at
    )


@router.get("/{id}/faculty", response_model=List[UserOut])
async def get_department_faculty_roster(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all faculty and staff members belonging to this department."""
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Security check: if department_head, can only view own department (or super_admin can view any)
    if current_user.role == UserRole.department_head and current_user.department_id != dept.id:
        raise HTTPException(status_code=403, detail="You can only access your assigned department")

    query = (
        select(User)
        .filter(or_(User.department_id == dept.id, User.department == dept.name, User.department == dept.code))
        .filter(User.role.in_([UserRole.faculty, UserRole.department_head]))
        .order_by(User.role.asc(), User.name.asc())
    )
    res = await db.execute(query)
    return res.scalars().all()


@router.put("/{id}/head")
async def assign_department_head(
    id: int,
    payload: DepartmentHeadAssign,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    """Assign or change the Department Head (VC Admin Only)."""
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    target_user: Optional[User] = None

    if payload.head_id:
        target_user = await db.get(User, payload.head_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Selected faculty user not found")
    elif payload.email or payload.employee_id:
        query_conditions = []
        if payload.email:
            query_conditions.append(User.email == payload.email.strip().lower())
        if payload.employee_id:
            query_conditions.append(User.employee_id == payload.employee_id.strip().upper())
        
        target_res = await db.execute(select(User).filter(or_(*query_conditions)))
        target_user = target_res.scalar_one_or_none()

        if not target_user:
            # Create new user for HOD
            emp_id = (payload.employee_id or f"HOD{dept.code}").strip().upper()
            email = (payload.email or f"{emp_id.lower()}@geeta.edu.in").strip().lower()
            name = (payload.name or f"Head of {dept.name}").strip()
            raw_pwd = payload.password or emp_id
            
            target_user = User(
                name=name,
                email=email,
                phone=payload.phone,
                employee_id=emp_id,
                password_hash=get_password_hash(raw_pwd),
                role=UserRole.department_head,
                department_id=dept.id,
                department=dept.name,
                designation="Head of Department (HOD)",
                is_active=True,
                must_change_password=False
            )
            db.add(target_user)
            await db.flush()
    else:
        raise HTTPException(status_code=400, detail="Must provide either head_id or user email/employee_id")

    # If department had a previous head, update previous head's role back to faculty if they don't head another dept
    if dept.head_id and dept.head_id != target_user.id:
        prev_head = await db.get(User, dept.head_id)
        if prev_head:
            prev_head.role = UserRole.faculty

    # Assign new head
    dept.head_id = target_user.id
    target_user.role = UserRole.department_head
    target_user.department_id = dept.id
    target_user.department = dept.name
    if payload.name:
        target_user.name = payload.name.strip()
    if payload.phone:
        target_user.phone = payload.phone.strip()
    if payload.employee_id:
        target_user.employee_id = payload.employee_id.strip().upper()

    await db.commit()
    await db.refresh(dept)
    await db.refresh(target_user)

    return {
        "success": True,
        "message": f"{target_user.name} has been appointed as Head of {dept.name}",
        "department_id": dept.id,
        "department_name": dept.name,
        "head_id": target_user.id,
        "head_name": target_user.name,
        "head_email": target_user.email,
        "head_employee_id": target_user.employee_id
    }


@router.post("/{id}/bulk-faculty", response_model=BulkFacultyResponse)
async def bulk_onboard_faculty_for_department(
    id: int,
    payload: BulkFacultyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk create faculty accounts with auto-generated passwords matching Employee ID, with support for multi-department resolution and HOD assignment."""
    dept = await db.get(Department, id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Check permission: Super Admin or Head of this department
    if current_user.role != UserRole.super_admin:
        if current_user.role != UserRole.department_head or current_user.department_id != dept.id:
            raise HTTPException(status_code=403, detail="Only VC Office or the Department Head can onboard faculty here.")

    # Pre-fetch all active departments for intelligent row-level department mapping
    all_depts_res = await db.execute(select(Department).filter(Department.is_active == True))
    all_depts = all_depts_res.scalars().all()
    dept_map = {}
    for d in all_depts:
        dept_map[d.id] = d
        dept_map[d.code.strip().lower()] = d
        dept_map[d.name.strip().lower()] = d

    created_accounts: List[FacultyCredentialItem] = []
    errors: List[str] = []
    skipped_count = 0

    for row in payload.faculty_list:
        emp_id = (row.employee_id or "").strip().upper()
        name = (row.name or "").strip()
        if not emp_id or not name:
            errors.append(f"Skipped invalid row missing Name or Employee ID: {row}")
            skipped_count += 1
            continue

        # Resolve row-specific department if specified (for master CSV uploads)
        target_row_dept = dept
        if row.department:
            dept_key = row.department.strip().lower()
            if dept_key in dept_map:
                target_row_dept = dept_map[dept_key]
            else:
                # Try partial match
                for d in all_depts:
                    if dept_key in d.name.lower() or d.code.lower() in dept_key:
                        target_row_dept = d
                        break

        # Check HOD designation flag
        is_row_hod = bool(row.is_hod) or ("hod" in (row.designation or "").lower()) or ("head" in (row.designation or "").lower())

        # Determine email: provided or <emp_id>@geeta.edu.in
        email = (row.email or f"{emp_id.lower()}@geeta.edu.in").strip().lower()
        
        # Check existing by email or employee_id
        existing_res = await db.execute(
            select(User).filter(or_(User.email == email, User.employee_id == emp_id))
        )
        existing_user = existing_res.scalar_one_or_none()
        if existing_user:
            # Update department linkage if unlinked or different
            if not existing_user.department_id:
                existing_user.department_id = target_row_dept.id
                existing_user.department = target_row_dept.name

            if is_row_hod:
                existing_user.role = UserRole.department_head
                target_row_dept.head_id = existing_user.id

            created_accounts.append(
                FacultyCredentialItem(
                    id=existing_user.id,
                    name=existing_user.name,
                    email=existing_user.email,
                    employee_id=existing_user.employee_id or emp_id,
                    designation=existing_user.designation or row.designation or "Faculty",
                    department=target_row_dept.name,
                    department_id=target_row_dept.id,
                    is_hod=is_row_hod or (target_row_dept.head_id == existing_user.id),
                    initial_password="[Existing Account]"
                )
            )
            skipped_count += 1
            continue

        # Initial password = Employee ID (e.g. GU3216)
        initial_pwd = emp_id
        hashed_pwd = get_password_hash(initial_pwd)

        new_user = User(
            name=name,
            email=email,
            phone=row.phone,
            password_hash=hashed_pwd,
            role=UserRole.department_head if is_row_hod else UserRole.faculty,
            department_id=target_row_dept.id,
            department=target_row_dept.name,
            designation=row.designation or ("Head of Department" if is_row_hod else "Assistant Professor"),
            employee_id=emp_id,
            is_active=True,
            must_change_password=False
        )
        db.add(new_user)
        await db.flush()

        if is_row_hod:
            target_row_dept.head_id = new_user.id

        created_accounts.append(
            FacultyCredentialItem(
                id=new_user.id,
                name=new_user.name,
                email=new_user.email,
                employee_id=new_user.employee_id,
                designation=new_user.designation or "Assistant Professor",
                department=target_row_dept.name,
                department_id=target_row_dept.id,
                is_hod=is_row_hod,
                initial_password=initial_pwd
            )
        )

    await db.commit()

    return BulkFacultyResponse(
        success=True,
        total_processed=len(payload.faculty_list),
        created_count=len(created_accounts),
        skipped_count=skipped_count,
        created_accounts=created_accounts,
        errors=errors
    )


@router.post("/upload-csv", response_model=BulkFacultyResponse)
async def upload_faculty_csv_file(
    department_id: Optional[int] = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a CSV file directly containing columns: Name, Employee_ID, Designation, Email, Phone, Department, is_hod."""
    # Read file content
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8-sig")
    except Exception:
        decoded = contents.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    faculty_rows: List[BulkFacultyRow] = []

    # Case-insensitive column matching
    for r in reader:
        norm = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in r.items() if k}
        name = norm.get("name") or norm.get("faculty_name") or norm.get("full_name") or ""
        emp_id = norm.get("employee_id") or norm.get("emp_id") or norm.get("id") or norm.get("empid") or ""
        designation = norm.get("designation") or norm.get("role") or norm.get("post") or "Assistant Professor"
        email = norm.get("email") or norm.get("mail") or None
        phone = norm.get("phone") or norm.get("mobile") or norm.get("contact") or None
        dept_val = norm.get("department") or norm.get("dept") or None
        
        is_hod_str = (norm.get("is_hod") or norm.get("hod") or norm.get("head") or norm.get("is_head") or "").lower()
        is_hod = is_hod_str in ("true", "1", "yes", "y", "hod", "head") or "hod" in designation.lower() or "head" in designation.lower()

        if name and emp_id:
            faculty_rows.append(
                BulkFacultyRow(
                    name=name,
                    employee_id=emp_id,
                    designation=designation,
                    email=email,
                    phone=phone,
                    department=dept_val,
                    is_hod=is_hod
                )
            )

    if not faculty_rows:
        raise HTTPException(status_code=400, detail="No valid faculty rows found. Required columns: Name, Employee_ID")

    # If department_id not specified, check current_user's department
    target_dept_id = department_id
    if not target_dept_id and current_user.role == UserRole.department_head:
        target_dept_id = current_user.department_id

    if not target_dept_id:
        # Fallback to first department or error
        first_dept = (await db.execute(select(Department).limit(1))).scalar_one_or_none()
        target_dept_id = first_dept.id if first_dept else 1

    return await bulk_onboard_faculty_for_department(
        id=target_dept_id,
        payload=BulkFacultyRequest(department_id=target_dept_id, faculty_list=faculty_rows),
        db=db,
        current_user=current_user
    )
