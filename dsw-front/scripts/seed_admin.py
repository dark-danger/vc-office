import asyncio
import os
import sys

# Add apps/api to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.database import engine, Base, AsyncSessionLocal
from app.models.all_models import (
    User, UserRole, Event, EventStatus, Task, TaskStatus, TaskPriority,
    Announcement, AnnouncementAudience, QueryItem, QueryStatus,
    DynamicForm, FeedbackForm, FeedbackQuestion, LeaderboardTask, SubmissionMode,
    StudentPointsLedger, FacultyPerformanceLedger
)
from app.core.security import get_password_hash

async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Super Admin
        admin = User(
            name="Dr. Rajesh Sharma (Dean)",
            email="admin@geeta.edu.in",
            phone="+91 98765 43210",
            role=UserRole.super_admin,
            password_hash=get_password_hash("admin123"),
            must_change_password=False
        )
        session.add(admin)

        # 2. Faculty Members
        fac1 = User(
            name="Prof. Amit Kumar",
            email="faculty@geeta.edu.in",
            phone="+91 98123 45678",
            department="Computer Science & Engineering",
            designation="Associate Professor",
            employee_id="GU-CSE-042",
            role=UserRole.faculty,
            password_hash=get_password_hash("faculty123"),
            must_change_password=False
        )
        fac2 = User(
            name="Dr. Sneha Verma",
            email="sneha.verma@geeta.edu.in",
            phone="+91 97123 88990",
            department="Management & Commerce",
            designation="Assistant Professor",
            employee_id="GU-MGT-019",
            role=UserRole.faculty,
            password_hash=get_password_hash("faculty123"),
            must_change_password=False
        )
        session.add_all([fac1, fac2])

        # 3. Student Members
        stu1 = User(
            name="Riya Sharma",
            email="student@geeta.edu.in",
            phone="+91 99887 76655",
            roll_number="GU2026001",
            course_branch="B.Tech CSE",
            year="3rd Year",
            role=UserRole.student,
            password_hash=get_password_hash("student123"),
            must_change_password=False
        )
        stu2 = User(
            name="Karan Malhotra",
            email="karan.m@geeta.edu.in",
            phone="+91 99887 11223",
            roll_number="GU2026045",
            course_branch="MBA Marketing",
            year="1st Year",
            role=UserRole.student,
            password_hash=get_password_hash("student123"),
            must_change_password=False
        )
        session.add_all([stu1, stu2])
        await session.flush()

        # 4. Initial Event
        event1 = Event(
            title="Annual Tech Fest 2026 - Technophilia",
            description="Geeta University's mega technical symposium featuring hackathons, robowars, and guest keynote lectures.",
            event_type="Symposium / Fest",
            venue="Main University Auditorium & Labs",
            coordinator_id=fac1.id,
            status=EventStatus.planned,
            created_by=admin.id
        )
        session.add(event1)
        await session.flush()

        # 5. Tasks (Parent + Subtask)
        parent_task = Task(
            title="Coordinate Keynote Speakers & Hospitality",
            description="Finalize travel itineraries, hotel bookings, and stage schedules for guest speakers.",
            task_type="event_linked",
            event_id=event1.id,
            assigned_to=fac1.id,
            assigned_by=admin.id,
            priority=TaskPriority.high,
            status=TaskStatus.in_progress
        )
        session.add(parent_task)
        await session.flush()

        sub_task = Task(
            title="Book Auditorium Sound System & Projection",
            description="Ensure AV setup check 24 hours prior to commencement.",
            task_type="event_linked",
            event_id=event1.id,
            parent_task_id=parent_task.id,
            assigned_to=fac2.id,
            assigned_by=admin.id,
            priority=TaskPriority.medium,
            status=TaskStatus.pending
        )
        session.add(sub_task)

        # 6. Initial Announcements
        ann1 = Announcement(
            title="Welcome to DSW Digital Portal!",
            body="The Dean of Student Welfare office is thrilled to launch our unified platform for task tracking, event coordination, dynamic forms, and gamified student/staff leaderboards.",
            audience=AnnouncementAudience.both,
            pinned=True,
            created_by=admin.id
        )
        ann2 = Announcement(
            title="Faculty Duty Roster Update for Tech Fest",
            body="All faculty coordinators are requested to review assigned sub-tasks on their portal dash.",
            audience=AnnouncementAudience.faculty,
            pinned=False,
            created_by=admin.id
        )
        session.add_all([ann1, ann2])

        # 7. Initial Query
        query1 = QueryItem(
            raised_by=fac1.id,
            raiser_role="faculty",
            subject="AV Budget approval for Technophilia",
            category="Administrative",
            description="Requesting confirmation on additional budget allocation for wireless mics.",
            status=QueryStatus.open
        )
        session.add(query1)

        # 8. Dynamic Public Form
        form1 = DynamicForm(
            title="Technophilia 2026 Student Registration",
            purpose_label="Registration Form",
            description="Public signup form for Geeta University Technophilia 2026 competition events.",
            form_schema=[
                {"field_id": "name", "label": "Full Name", "type": "text", "required": True},
                {"field_id": "roll_number", "label": "Roll Number", "type": "text", "required": True},
                {"field_id": "course", "label": "Course & Branch", "type": "text", "required": True},
                {"field_id": "email", "label": "Email Address", "type": "email", "required": True},
                {"field_id": "phone", "label": "Phone Number", "type": "phone", "required": True},
                {"field_id": "event_choice", "label": "Participating Event", "type": "dropdown", "required": True, "options": ["Hackathon", "Robo Wars", "Tech Quiz", "Coding Sprint"]}
            ],
            google_sheet_id="sheet_technophilia_2026",
            google_sheet_tab_name="Registrations",
            public_slug="technophilia-2026-reg",
            created_by=admin.id
        )
        session.add(form1)

        # 9. Feedback Form
        feedback1 = FeedbackForm(
            title="Student Welfare Seminar Feedback",
            description="Share your feedback regarding the recent career orientation session.",
            require_identification=False,
            created_by=admin.id
        )
        session.add(feedback1)
        await session.flush()

        q1 = FeedbackQuestion(
            form_id=feedback1.id,
            question_text="How would you rate the overall seminar content?",
            question_type="single_choice",
            options=["Excellent", "Good", "Average", "Needs Improvement"],
            order_index=0,
            required=True
        )
        q2 = FeedbackQuestion(
            form_id=feedback1.id,
            question_text="Which topics did you find most valuable?",
            question_type="multi_choice",
            options=["Resume Building", "Interview Skills", "Industry Placement Trends", "Q&A Session"],
            order_index=1,
            required=True
        )
        session.add_all([q1, q2])

        # 10. Leaderboard Tasks (Single & Multiple submission modes)
        ltask1 = LeaderboardTask(
            title="Volunteer at Blood Donation Camp",
            description="Participate as a student volunteer during the DSW Blood Donation Drive and upload your participation certificate.",
            points_value=25,
            submission_mode=SubmissionMode.single,
            created_by=admin.id
        )
        ltask2 = LeaderboardTask(
            title="Publish a Tech Blog / Article",
            description="Write and publish an academic or technical article on the Geeta University Student Portal (recurring reward).",
            points_value=15,
            submission_mode=SubmissionMode.multiple,
            created_by=admin.id
        )
        session.add_all([ltask1, ltask2])

        # 11. Initial Ledger Points
        pledger1 = StudentPointsLedger(
            student_id=stu1.id,
            points=50,
            source_type="manual_award",
            reason_note="Outstanding contribution as DSW Student Student Coordinator",
            awarded_by=admin.id
        )
        session.add(pledger1)

        fledger1 = FacultyPerformanceLedger(
            faculty_id=fac1.id,
            score_delta=10,
            source_type="task_approved",
            note="Completed duty assignment on schedule (+10)"
        )
        session.add(fledger1)

        await session.commit()
        print("Database successfully seeded with super_admin, faculty, student, event, tasks, forms, and leaderboards!")

if __name__ == "__main__":
    asyncio.run(seed_database())
