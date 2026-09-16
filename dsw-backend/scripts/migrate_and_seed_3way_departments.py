import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.core.security import get_password_hash
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

# 15 Standard Departments
DEPARTMENTS_DATA = [
    # Academic (10)
    {"name": "Computer Science & Engineering (CSE)", "code": "CSE", "category": "academic", "description": "School of Computer Science, AI/ML, Cloud Computing and IT Engineering"},
    {"name": "Geeta Technical Hub (GTH)", "code": "GTH", "category": "academic", "description": "Advanced Technical Training, Industry Collaborations, Coding Bootcamps & Incubation"},
    {"name": "Management Studies", "code": "MGMT", "category": "academic", "description": "School of Business, MBA, BBA, Commerce and Financial Leadership"},
    {"name": "Pharmaceutical Sciences", "code": "PHARM", "category": "academic", "description": "Pharmacy, Drug Research, Pharmacology and Clinical Formulations"},
    {"name": "Agricultural Sciences", "code": "AGRI", "category": "academic", "description": "Agronomy, Horticulture, Soil Science and Smart Agriculture Technologies"},
    {"name": "Forensic Sciences", "code": "FORENSIC", "category": "academic", "description": "Criminology, Cyber Forensics, Ballistics and Crime Investigation"},
    {"name": "Nutrition & Dietetics", "code": "NUTRITION", "category": "academic", "description": "Clinical Nutrition, Diet Planning, Food Science and Public Health"},
    {"name": "Psychology Department", "code": "PSYCH", "category": "academic", "description": "Behavioral Science, Counseling, Cognitive Psychology and Mental Wellness"},
    {"name": "Law & Legal Studies", "code": "LAW", "category": "academic", "description": "School of Law, Constitutional Law, Corporate Legalities, Moot Courts and Judiciary"},
    {"name": "Hotel Management & Hospitality", "code": "HM", "category": "academic", "description": "Hospitality Operations, Culinary Arts, Tourism and Event Management"},
    
    # Non-Teaching / Administrative (5)
    {"name": "Human Resources (HR)", "code": "HR", "category": "administrative", "description": "University Staffing, Recruitment, Talent Management, Payroll & Policies"},
    {"name": "Admissions Department", "code": "ADMISSIONS", "category": "administrative", "description": "University Student Enrollments, Outreach, Counseling and Verification"},
    {"name": "Accounts & Finance", "code": "ACCOUNTS", "category": "administrative", "description": "Financial Planning, Fee Management, University Audit, Grants and Billing"},
    {"name": "Subordinate Staff & Operations", "code": "SUBORDINATE", "category": "administrative", "description": "Campus Logistics, Facility Maintenance, Support Staff and Campus Operations"},
    {"name": "IT & Technical Infrastructure", "code": "IT", "category": "administrative", "description": "Campus Networks, Server Infrastructure, Cybersecurity and Enterprise Software"},
]

async def migrate_and_seed():
    print("[DB] Starting 3-Way Department & Role migration on Supabase...")
    async with engine.begin() as conn:
        # 1. Update UserRole Postgres enum safely
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type typ
                    JOIN pg_enum enm ON typ.oid = enm.enumtypid
                    WHERE typ.typname = 'userrole' AND enm.enumlabel = 'department_head'
                ) THEN
                    ALTER TYPE userrole ADD VALUE 'department_head' AFTER 'super_admin';
                END IF;
            END $$;
        """))
        print(" -> userrole enum updated with 'department_head'")

        # 2. Create departments table and indexes
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) UNIQUE NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                category VARCHAR(50) DEFAULT 'academic',
                head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                description TEXT,
                points INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_departments_code ON departments(code)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_departments_category ON departments(category)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_departments_head_id ON departments(head_id)"))
        print(" -> departments table verified/created")

        # 3. Add department_id and employee_id to users if not exists
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'department_id'
                ) THEN
                    ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
                END IF;
            END $$;
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_department_id ON users(department_id)"))

        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'employee_id'
                ) THEN
                    ALTER TABLE users ADD COLUMN employee_id VARCHAR(50);
                END IF;
            END $$;
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_employee_id ON users(employee_id)"))
        print(" -> users columns verified/added")

        # 4. Add department_id, target_scope, assigned_by_role, points_reward to tasks if not exists
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = 'department_id'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
                END IF;
            END $$;
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_department_id ON tasks(department_id)"))

        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = 'target_scope'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN target_scope VARCHAR(50) DEFAULT 'individual';
                END IF;
            END $$;
        """))

        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = 'assigned_by_role'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN assigned_by_role VARCHAR(50) DEFAULT 'super_admin';
                END IF;
            END $$;
        """))

        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = 'points_reward'
                ) THEN
                    ALTER TABLE tasks ADD COLUMN points_reward INTEGER DEFAULT 10;
                END IF;
            END $$;
        """))
        print(" -> tasks columns verified/added")

    # 5. Seed 15 Departments & create demo Department Head accounts
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        dept_map = {}
        for d in DEPARTMENTS_DATA:
            res = await session.execute(text("SELECT id, name, code, head_id FROM departments WHERE code = :code"), {"code": d["code"]})
            existing = res.fetchone()
            if existing:
                dept_map[d["code"]] = existing[0]
            else:
                insert_res = await session.execute(
                    text("""
                        INSERT INTO departments (name, code, category, description, points, is_active, created_at, updated_at)
                        VALUES (:name, :code, :category, :description, 0, TRUE, NOW(), NOW())
                        RETURNING id;
                    """),
                    d
                )
                dept_id = insert_res.scalar()
                dept_map[d["code"]] = dept_id
        await session.commit()
        print(f" -> 15 Departments seeded / verified in DB: {list(dept_map.keys())}")

        # Seed CSE Department Head: Dr. Rajesh Sharma (head.cse@geeta.edu.in / GU1001)
        cse_dept_id = dept_map.get("CSE")
        res = await session.execute(text("SELECT id FROM users WHERE email = 'head.cse@geeta.edu.in'"))
        cse_head = res.fetchone()
        if not cse_head:
            cse_head_res = await session.execute(
                text("""
                    INSERT INTO users (name, email, password_hash, role, department, department_id, designation, employee_id, is_active, must_change_password, created_at, updated_at)
                    VALUES (:name, :email, :password_hash, 'department_head', :department, :department_id, :designation, :employee_id, TRUE, FALSE, NOW(), NOW())
                    RETURNING id;
                """),
                {
                    "name": "Dr. Rajesh Sharma (HOD CSE)",
                    "email": "head.cse@geeta.edu.in",
                    "password_hash": get_password_hash("GU1001"),
                    "department": "Computer Science & Engineering (CSE)",
                    "department_id": cse_dept_id,
                    "designation": "Head of Department (Professor)",
                    "employee_id": "GU1001"
                }
            )
            cse_head_id = cse_head_res.scalar()
            await session.execute(text("UPDATE departments SET head_id = :head_id WHERE id = :id"), {"head_id": cse_head_id, "id": cse_dept_id})
            print(f" -> Created CSE Dept Head: head.cse@geeta.edu.in (Pass: GU1001, Emp ID: GU1001)")

        # Update existing faculty Yash to CSE department
        await session.execute(
            text("""
                UPDATE users 
                SET department_id = :dept_id, department = 'Computer Science & Engineering (CSE)', employee_id = 'GU3216'
                WHERE email = 'faculty@geeta.edu.in';
            """),
            {"dept_id": cse_dept_id}
        )
        await session.commit()
        print(" -> Updated Faculty Yash: department linked to CSE, Emp ID: GU3216")

    print("[DB] Migration and Seeding Complete Successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_and_seed())
