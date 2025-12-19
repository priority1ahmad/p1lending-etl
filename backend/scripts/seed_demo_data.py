#!/usr/bin/env python3
"""
Seed demo data for testing the Dashboard and ETL features.
Creates demo scripts, jobs (previews and ETL runs), and job logs.

Usage:
    cd /home/aallouch/projects/LodasoftETL/new_app/backend
    source venv/bin/activate
    python scripts/seed_demo_data.py
"""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

import sys
sys.path.insert(0, '/home/aallouch/projects/LodasoftETL/new_app/backend')

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.models import User, SQLScript, ETLJob, JobLog
from app.db.models.job import JobType, JobStatus


# Demo SQL scripts
DEMO_SCRIPTS = [
    {
        "name": "California Refinance Leads",
        "description": "Refinance leads from California with LTV > 80%",
        "content": "SELECT * FROM leads WHERE state = 'CA' AND loan_type = 'refinance' AND ltv > 0.8"
    },
    {
        "name": "Texas Purchase Leads",
        "description": "Purchase leads from Texas market",
        "content": "SELECT * FROM leads WHERE state = 'TX' AND loan_type = 'purchase'"
    },
    {
        "name": "High Value Leads Q4",
        "description": "High value leads for Q4 2024 campaign",
        "content": "SELECT * FROM leads WHERE estimated_value > 500000 AND created_date >= '2024-10-01'"
    },
    {
        "name": "FHA Streamline Candidates",
        "description": "Existing FHA borrowers eligible for streamline refinance",
        "content": "SELECT * FROM leads WHERE current_loan_type = 'FHA' AND rate_reduction_eligible = true"
    },
    {
        "name": "ARM Reset Leads",
        "description": "Leads with ARMs resetting in next 6 months",
        "content": "SELECT * FROM leads WHERE arm_index_type IS NOT NULL AND rate_adjustment_date <= CURRENT_DATE + 180"
    },
]


async def create_demo_data():
    """Create demo data for testing."""

    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Get or create a demo user
            result = await session.execute(select(User).limit(1))
            user = result.scalar_one_or_none()

            if not user:
                print("No user found. Please create a user first by logging in.")
                return

            print(f"Using user: {user.email}")

            # Create demo scripts
            scripts = []
            for script_data in DEMO_SCRIPTS:
                # Check if script already exists
                result = await session.execute(
                    select(SQLScript).where(SQLScript.name == script_data["name"])
                )
                existing = result.scalar_one_or_none()

                if existing:
                    print(f"  Script '{script_data['name']}' already exists, skipping...")
                    scripts.append(existing)
                else:
                    script = SQLScript(
                        id=uuid.uuid4(),
                        name=script_data["name"],
                        description=script_data["description"],
                        content=script_data["content"],
                        created_by=user.id,
                    )
                    session.add(script)
                    scripts.append(script)
                    print(f"  Created script: {script_data['name']}")

            await session.commit()
            print(f"\nCreated {len(scripts)} scripts")

            # Create demo jobs (mix of previews and ETL runs)
            jobs_created = 0
            now = datetime.now(timezone.utc)

            job_configs = [
                # Recent completed ETL jobs
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 1, "rows": 500, "lit": 12, "dnc": 45, "both": 3, "clean": 440},
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 3, "rows": 1200, "lit": 28, "dnc": 95, "both": 8, "clean": 1069},
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 6, "rows": 750, "lit": 15, "dnc": 62, "both": 5, "clean": 668},
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 12, "rows": 2000, "lit": 42, "dnc": 156, "both": 12, "clean": 1790},
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 24, "rows": 350, "lit": 8, "dnc": 28, "both": 2, "clean": 312},

                # Completed previews
                {"type": JobType.PREVIEW, "status": JobStatus.COMPLETED, "hours_ago": 0.5, "rows": 100},
                {"type": JobType.PREVIEW, "status": JobStatus.COMPLETED, "hours_ago": 2, "rows": 50},
                {"type": JobType.PREVIEW, "status": JobStatus.COMPLETED, "hours_ago": 5, "rows": 200},

                # Failed job
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.FAILED, "hours_ago": 8, "rows": 0, "error": "Connection timeout to Snowflake"},

                # Cancelled job
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.CANCELLED, "hours_ago": 18, "rows": 125},

                # More completed ETL jobs for pagination testing
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 36, "rows": 890, "lit": 18, "dnc": 72, "both": 6, "clean": 794},
                {"type": JobType.SINGLE_SCRIPT, "status": JobStatus.COMPLETED, "hours_ago": 48, "rows": 1500, "lit": 35, "dnc": 120, "both": 10, "clean": 1335},
            ]

            for i, config in enumerate(job_configs):
                script = random.choice(scripts)
                started_at = now - timedelta(hours=config["hours_ago"])
                completed_at = started_at + timedelta(minutes=random.randint(5, 30)) if config["status"] in [JobStatus.COMPLETED, JobStatus.FAILED] else None

                is_preview = config["type"] == JobType.PREVIEW

                job = ETLJob(
                    id=uuid.uuid4(),
                    job_type=config["type"],
                    script_id=script.id,
                    status=config["status"],
                    progress=100 if config["status"] == JobStatus.COMPLETED else (0 if config["status"] == JobStatus.FAILED else random.randint(10, 90)),
                    message="Job completed successfully" if config["status"] == JobStatus.COMPLETED else config.get("error", "Processing..."),
                    row_limit=config["rows"] if is_preview else None,
                    table_id=f"{script.name.replace(' ', '_')}_{config['rows']}_{started_at.strftime('%d%m%Y')}" if not is_preview else None,
                    total_rows_processed=config["rows"],
                    litigator_count=config.get("lit", 0) if not is_preview else 0,
                    dnc_count=config.get("dnc", 0) if not is_preview else 0,
                    both_count=config.get("both", 0) if not is_preview else 0,
                    clean_count=config.get("clean", 0) if not is_preview else 0,
                    error_message=config.get("error"),
                    started_by=user.id,
                    started_at=started_at,
                    completed_at=completed_at,
                )
                session.add(job)
                jobs_created += 1

                # Add some logs for each job
                log_messages = [
                    ("INFO", f"Starting {'preview' if is_preview else 'ETL'} job for {script.name}"),
                    ("INFO", f"Querying Snowflake for lead data..."),
                    ("INFO", f"Retrieved {config['rows']} rows from Snowflake"),
                ]

                if not is_preview and config["status"] == JobStatus.COMPLETED:
                    log_messages.extend([
                        ("INFO", "Starting idiCORE enrichment..."),
                        ("INFO", f"Processed {config['rows']} records through idiCORE"),
                        ("INFO", "Running CCC litigator check..."),
                        ("WARNING", f"Found {config.get('lit', 0)} litigator matches"),
                        ("INFO", "Running DNC check..."),
                        ("WARNING", f"Found {config.get('dnc', 0)} DNC matches"),
                        ("INFO", f"Uploading {config.get('clean', 0)} clean records to Snowflake"),
                        ("INFO", "Job completed successfully"),
                    ])
                elif config["status"] == JobStatus.FAILED:
                    log_messages.append(("ERROR", config.get("error", "Unknown error")))
                elif is_preview:
                    log_messages.append(("INFO", "Preview completed"))

                for level, message in log_messages:
                    log = JobLog(
                        id=uuid.uuid4(),
                        job_id=job.id,
                        level=level,
                        message=message,
                    )
                    session.add(log)

            await session.commit()
            print(f"Created {jobs_created} demo jobs with logs")

            # Summary
            print("\n" + "="*50)
            print("DEMO DATA CREATED SUCCESSFULLY")
            print("="*50)
            print(f"\nScripts: {len(scripts)}")
            print(f"Jobs: {jobs_created}")
            print(f"  - Completed ETL runs: 7")
            print(f"  - Completed previews: 3")
            print(f"  - Failed jobs: 1")
            print(f"  - Cancelled jobs: 1")
            print("\nYou can now test:")
            print("  1. Dashboard pagination (12 jobs > 5 per page)")
            print("  2. 'View Results' button on completed ETL jobs")
            print("  3. Job history filtering")
            print("  4. Results page auto-selection via URL")

        except Exception as e:
            await session.rollback()
            print(f"Error creating demo data: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    print("="*50)
    print("SEEDING DEMO DATA")
    print("="*50 + "\n")
    asyncio.run(create_demo_data())
