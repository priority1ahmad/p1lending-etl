# Snowflake MASTER_PROCESSED_DB Verification Report

**Date**: December 8, 2024
**Status**: ✅ Auto-Creation Logic Verified

---

## Summary

The `MASTER_PROCESSED_DB` table in Snowflake's `PROCESSED_DATA_DB.PUBLIC` schema is configured to **auto-create** when the ETL Results Service initializes. Based on code analysis, the table creation logic is properly implemented and will execute on first use.

---

## Table Location

- **Database**: `PROCESSED_DATA_DB`
- **Schema**: `PUBLIC`
- **Table**: `MASTER_PROCESSED_DB`
- **Full Path**: `PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB`

---

## Auto-Creation Logic

The table is created automatically by the `ETLResultsService` class:

**File**: `backend/app/services/etl/results_service.py`
**Method**: `_ensure_table_exists()` (lines 45-88)

### When Does Creation Happen?

1. When `ETLResultsService` initializes
2. When `_ensure_connection()` is called
3. Automatically on first ETL job execution that uses results storage

### Creation SQL

```sql
CREATE TABLE IF NOT EXISTS PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB (
    "record_id" VARCHAR NOT NULL,
    "job_id" VARCHAR NOT NULL,
    "job_name" VARCHAR NOT NULL,
    "processed_at" TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),

    -- Person Data
    "first_name" VARCHAR,
    "last_name" VARCHAR,
    "address" VARCHAR,
    "city" VARCHAR,
    "state" VARCHAR,
    "zip_code" VARCHAR,

    -- Phone Data
    "phone_1" VARCHAR,
    "phone_2" VARCHAR,
    "phone_3" VARCHAR,

    -- Email Data
    "email_1" VARCHAR,
    "email_2" VARCHAR,
    "email_3" VARCHAR,

    -- Compliance Flags
    "in_litigator_list" VARCHAR DEFAULT 'No',
    "phone_1_in_dnc" VARCHAR DEFAULT 'No',
    "phone_2_in_dnc" VARCHAR DEFAULT 'No',
    "phone_3_in_dnc" VARCHAR DEFAULT 'No',

    -- Additional Data (JSON for flexibility)
    "additional_data" VARIANT,

    PRIMARY KEY ("record_id")
)
```

---

## Expected Schema (21 columns)

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| record_id | VARCHAR | NOT NULL | - | Unique record identifier (UUID) |
| job_id | VARCHAR | NOT NULL | - | ETL job ID |
| job_name | VARCHAR | NOT NULL | - | Name of SQL script/job |
| processed_at | TIMESTAMP_NTZ | NOT NULL | CURRENT_TIMESTAMP() | When record was processed |
| first_name | VARCHAR | YES | NULL | Contact first name |
| last_name | VARCHAR | YES | NULL | Contact last name |
| address | VARCHAR | YES | NULL | Street address |
| city | VARCHAR | YES | NULL | City |
| state | VARCHAR | YES | NULL | State code |
| zip_code | VARCHAR | YES | NULL | ZIP code |
| phone_1 | VARCHAR | YES | NULL | Primary phone number |
| phone_2 | VARCHAR | YES | NULL | Secondary phone number |
| phone_3 | VARCHAR | YES | NULL | Tertiary phone number |
| email_1 | VARCHAR | YES | NULL | Primary email |
| email_2 | VARCHAR | YES | NULL | Secondary email |
| email_3 | VARCHAR | YES | NULL | Tertiary email |
| in_litigator_list | VARCHAR | YES | 'No' | Litigator check result |
| phone_1_in_dnc | VARCHAR | YES | 'No' | Phone 1 DNC status |
| phone_2_in_dnc | VARCHAR | YES | 'No' | Phone 2 DNC status |
| phone_3_in_dnc | VARCHAR | YES | 'No' | Phone 3 DNC status |
| additional_data | VARIANT | YES | NULL | JSON for extra fields |

---

## How to Manually Verify

### Option 1: Run Verification Script (Requires Backend Container)

```bash
# Start backend services
docker-compose -f docker-compose.prod.yml up -d backend

# Run verification script
docker-compose -f docker-compose.prod.yml exec backend python scripts/verify_snowflake_table.py
```

### Option 2: Direct Snowflake Query

Connect to Snowflake and run:

```sql
-- Check if database exists
SELECT DATABASE_NAME
FROM INFORMATION_SCHEMA.DATABASES
WHERE DATABASE_NAME = 'PROCESSED_DATA_DB';

-- Check if table exists
SELECT TABLE_NAME, ROW_COUNT, BYTES
FROM PROCESSED_DATA_DB.INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'PUBLIC'
AND TABLE_NAME = 'MASTER_PROCESSED_DB';

-- View table schema
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM PROCESSED_DATA_DB.INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'PUBLIC'
AND TABLE_NAME = 'MASTER_PROCESSED_DB'
ORDER BY ORDINAL_POSITION;

-- Check row count
SELECT COUNT(*) as total_records
FROM PROCESSED_DATA_DB.PUBLIC.MASTER_PROCESSED_DB;
```

### Option 3: Trigger Table Creation

Run any ETL job through the application. The table will be created automatically before storing results.

---

## Code References

### ETL Results Service
- **File**: `backend/app/services/etl/results_service.py`
- **Class**: `ETLResultsService`
- **Key Methods**:
  - `_ensure_connection()` - Ensures Snowflake connection and creates table
  - `_ensure_table_exists()` - Executes CREATE TABLE IF NOT EXISTS
  - `store_batch_results()` - Stores processed records (triggers auto-creation)

### API Endpoints
- **File**: `backend/app/api/v1/endpoints/results.py`
- **Endpoints**:
  - `GET /api/v1/results/jobs` - List all jobs
  - `GET /api/v1/results/jobs/{job_id}` - Get job results
  - `GET /api/v1/results/export` - Export to CSV

### Frontend Pages
- **File**: `frontend/src/pages/ETLResults.tsx`
- **Purpose**: Display and export results from MASTER_PROCESSED_DB

---

## Prerequisites for Table Creation

### 1. Database Must Exist
The `PROCESSED_DATA_DB` database must be created manually in Snowflake:

```sql
CREATE DATABASE IF NOT EXISTS PROCESSED_DATA_DB;
GRANT ALL ON DATABASE PROCESSED_DATA_DB TO ROLE ORGADMIN;
```

### 2. Permissions Required
The Snowflake user must have:
- `CREATE TABLE` permission on `PROCESSED_DATA_DB.PUBLIC` schema
- `INSERT`, `SELECT`, `DELETE` permissions on tables
- Typically granted through `ORGADMIN` role

### 3. Environment Variables
Required in `.env`:
```bash
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PRIVATE_KEY_PASSWORD=your_password
SNOWFLAKE_DATABASE=PROCESSED_DATA_DB
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_ROLE=ORGADMIN
```

### 4. Secrets File
Private key file must exist:
- **Path**: `backend/secrets/rsa_key.p8`
- **Type**: Snowflake RSA private key

---

## Troubleshooting

### Error: "Database PROCESSED_DATA_DB does not exist"

**Solution**: Create the database manually:
```sql
CREATE DATABASE PROCESSED_DATA_DB;
```

### Error: "Insufficient privileges to create table"

**Solution**: Grant permissions to your Snowflake user:
```sql
USE ROLE ACCOUNTADMIN;
GRANT CREATE TABLE ON SCHEMA PROCESSED_DATA_DB.PUBLIC TO ROLE ORGADMIN;
GRANT ALL ON DATABASE PROCESSED_DATA_DB TO ROLE ORGADMIN;
```

### Error: "Failed to connect to Snowflake"

**Checklist**:
1. Verify `rsa_key.p8` exists in `backend/secrets/`
2. Check `SNOWFLAKE_PRIVATE_KEY_PASSWORD` is correct
3. Verify account name format: `account.region` (e.g., `xy12345.us-east-1`)
4. Ensure warehouse is running

### Table Not Creating

**Possible causes**:
1. `PROCESSED_DATA_DB` database doesn't exist (create it manually)
2. User lacks CREATE TABLE permission
3. ETL Results Service hasn't initialized yet (run an ETL job)
4. Snowflake connection is failing (check logs)

---

## Testing Table Creation

### Test 1: Initialize Service Manually

```python
from app.services.etl.results_service import get_results_service

service = get_results_service()
if service._ensure_connection():
    print("✅ Table created successfully")
else:
    print("❌ Connection failed")
```

### Test 2: Store Sample Data

```python
import pandas as pd
from app.services.etl.results_service import get_results_service

# Sample data
data = {
    'First Name': ['John'],
    'Last Name': ['Doe'],
    'Address': ['123 Main St'],
    'City': ['Boston'],
    'State': ['MA'],
    'Zip': ['02101'],
    'Phone 1': ['555-1234'],
    'Email 1': ['john@example.com'],
    'In Litigator List': ['No'],
    'Phone 1 In DNC List': ['No']
}

df = pd.DataFrame(data)

service = get_results_service()
stored = service.store_batch_results(
    job_id='test-job-123',
    job_name='Test Script',
    records=df
)

print(f"Stored {stored} records")
```

---

## Integration Points

### Where Results Are Stored

1. **ETL Engine** (`backend/app/services/etl/engine.py`)
   - Calls `results_service.store_batch_results()` after processing
   - Replaces Google Sheets upload (staging branch feature)

2. **API Endpoints** (`backend/app/api/v1/endpoints/results.py`)
   - Retrieves stored results for display
   - Supports pagination, filtering, export

3. **Frontend** (`frontend/src/pages/ETLResults.tsx`)
   - Displays results in data table
   - Allows CSV export
   - Filters by job, excludes litigators

---

## Conclusion

✅ **Table auto-creation logic is properly implemented**
✅ **Schema definition matches requirements**
✅ **Integration points are complete**
⚠️ **Manual database creation required**: `PROCESSED_DATA_DB` must exist
⚠️ **Permissions required**: User needs CREATE TABLE privilege

The `MASTER_PROCESSED_DB` table will be created automatically on first ETL job execution, provided the `PROCESSED_DATA_DB` database exists and the user has proper permissions.

---

## Next Steps

1. **Ensure Database Exists**: Create `PROCESSED_DATA_DB` in Snowflake
2. **Grant Permissions**: Ensure ORGADMIN role has CREATE TABLE privilege
3. **Run ETL Job**: Execute a test ETL job to trigger table creation
4. **Verify Results**: Check ETL Results page in frontend

---

*Generated: December 8, 2024*
