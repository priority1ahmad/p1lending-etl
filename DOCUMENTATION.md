# Project Documentation

> AI-generated documentation built incrementally from code changes.
> Last updated: 2024-12-19

## Architecture Overview

### Backend (FastAPI + Celery)

The backend is a FastAPI application providing REST APIs for ETL job management, authentication, and data retrieval. It uses:
- **FastAPI** for async HTTP endpoints
- **Celery** with Redis for background task processing
- **SQLAlchemy 2.0** (async) for PostgreSQL database operations
- **Pydantic** for request/response validation

Key directories:
- `backend/app/api/` - API endpoints
- `backend/app/services/` - Business logic and ETL pipeline
- `backend/app/db/` - Database models and sessions
- `backend/app/workers/` - Celery task definitions

### Frontend (React + TypeScript)

The frontend is a React single-page application using:
- **React 19** with functional components and hooks
- **Material UI 7** for component library
- **TanStack Query** for server state management
- **Zustand** for client state (auth, UI)
- **React Router** for navigation

Key directories:
- `frontend/src/pages/` - Page components
- `frontend/src/components/` - Reusable UI components
- `frontend/src/services/` - API client functions
- `frontend/src/stores/` - Zustand state stores

### ETL Pipeline

The ETL pipeline enriches mortgage lead data:
1. **Extract**: Query lead data from Snowflake using SQL scripts
2. **Transform**: Enrich with idiCORE API (phone/email lookup)
3. **Validate**: Check against CCC Litigator API and DNC database
4. **Load**: Store results in Snowflake MASTER_PROCESSED_DB (single bulk upload at end)

Key services:
- `engine.py` - Main orchestrator, accumulates results during processing
- `idicore_service.py` - Phone/email enrichment (batch processing)
- `ccc_service.py` - Litigator checking
- `dnc_service.py` - Do Not Call validation
- `results_service.py` - Snowflake result storage (42-column schema)

#### Snowflake Schema

**Table:** `PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB`

The results table contains **42 columns** organized by category:

**Metadata (6 columns)**
- `record_id` (UUID, PK) - Auto-generated unique identifier
- `job_id` (VARCHAR) - ETL job identifier
- `job_name` (VARCHAR) - Script name
- `table_id` (VARCHAR) - Human-readable table ID (e.g., `FHA_12182024_847392`)
- `table_title` (VARCHAR) - Optional display title
- `processed_at` (TIMESTAMP_NTZ) - Processing timestamp

**Lead Information (5 columns)**
- `lead_number`, `campaign_date`, `lead_campaign`, `lead_source`, `ref_id`

**Person Data (7 columns)**
- `first_name`, `last_name`, `co_borrower_full_name`, `address`, `city`, `state`, `zip`

**Property Data (5 columns)**
- `total_units`, `owner_occupied`, `annual_tax_amount`, `assessed_value`, `estimated_value`

**First Mortgage (7 columns)**
- `ltv`, `loan_type`, `first_mortgage_type`, `first_mortgage_amount`, `first_mortgage_balance`, `term`, `estimated_new_payment`

**Second Mortgage (4 columns)**
- `second_mortgage_type`, `second_mortgage_term`, `second_mortgage_balance`, `has_second_mortgage`

**Current Loan Details (5 columns)**
- `current_interest_rate`, `current_lender`, `arm_index_type`, `origination_date`, `rate_adjustment_date`

**Contact Data - Enriched (6 columns)**
- `phone_1`, `phone_2`, `phone_3` - From idiCORE API
- `email_1`, `email_2`, `email_3` - From idiCORE API

**Compliance Flags (4 columns)**
- `in_litigator_list` - 'Yes'/'No' from CCC API
- `phone_1_in_dnc`, `phone_2_in_dnc`, `phone_3_in_dnc` - DNC database check

All mortgage fields are VARCHAR type and sourced from Snowflake SQL queries.

#### Progress Tracking

Real-time job progress is tracked via WebSocket events with the following metrics:

- **Progress Percentage**: 0-100% completion
- **Rows Processed**: Current row / Total rows
- **Rows Remaining**: Dynamically calculated
- **Batch Progress**: Current batch / Total batches (200 rows per batch)
- **Time Remaining**: ETA calculated from processing speed (formatted: "Xm Ys" or "Xh Ym")
- **Elapsed Time**: Duration since job start
- **Upload Notification**: Visual indicator during final Snowflake upload phase

Progress events are emitted via Redis pub/sub and displayed in real-time on the frontend.

---

## Component Registry

<!-- Components are automatically documented below as code changes are made -->

