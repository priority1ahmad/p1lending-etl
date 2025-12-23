---
allowed-tools: Read, Write, Grep, Glob
description: Generate .env.example from config.py with descriptions
argument-hint: "[output-file]"
---

## Task
Parse `backend/app/core/config.py` to extract all environment variables and generate a documented `.env.example` file with descriptions, defaults, and security annotations.

## Supported Arguments
- `[output-file]` - Output file path (default: `env.example`)

## Workflow

### Step 1: Parse Config File
Read and analyze `@backend/app/core/config.py`:

Extract from Pydantic Settings classes:
- Field names (converted to UPPER_SNAKE_CASE)
- Type hints
- Default values
- Field descriptions (from `Field(description=...)`)
- Validators

### Step 2: Categorize Variables
Group variables by category:

```
# Database
# Security
# External APIs
# Feature Flags
# Logging
# Infrastructure
```

### Step 3: Identify Sensitive Variables
Mark variables as sensitive based on:
- Name contains: `password`, `secret`, `key`, `token`, `credential`
- Type is `SecretStr`
- Used for authentication

### Step 4: Generate env.example
Create structured `.env.example`:

```bash
# ============================================================================
# P1Lending ETL - Environment Configuration
# Generated from backend/app/core/config.py
# Last updated: [DATE]
# ============================================================================

# ----------------------------------------------------------------------------
# DATABASE
# PostgreSQL connection settings
# ----------------------------------------------------------------------------

# Database host (default: localhost)
POSTGRES_HOST=localhost

# Database port (default: 5432)
POSTGRES_PORT=5432

# Database name
POSTGRES_DB=p1lending_etl

# Database user
POSTGRES_USER=p1lending

# Database password [SENSITIVE]
# POSTGRES_PASSWORD=<your-secure-password>

# ----------------------------------------------------------------------------
# SECURITY
# Authentication and encryption settings
# ----------------------------------------------------------------------------

# JWT secret key [SENSITIVE] - Generate with: openssl rand -hex 32
# SECRET_KEY=<generate-secure-key>

# JWT algorithm (default: HS256)
JWT_ALGORITHM=HS256

# Access token expiration in minutes (default: 30)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Refresh token expiration in days (default: 7)
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS allowed origins (JSON array)
CORS_ORIGINS=["http://localhost:3000"]

# ----------------------------------------------------------------------------
# SNOWFLAKE
# Data warehouse connection
# ----------------------------------------------------------------------------

# Snowflake account identifier
SNOWFLAKE_ACCOUNT=your_account

# Snowflake username
SNOWFLAKE_USER=your_user

# Snowflake private key password [SENSITIVE]
# SNOWFLAKE_PRIVATE_KEY_PASSWORD=<your-key-password>

# Snowflake role (default: ACCOUNTADMIN)
SNOWFLAKE_ROLE=ACCOUNTADMIN

# Snowflake warehouse
SNOWFLAKE_WAREHOUSE=COMPUTE_WH

# Snowflake database
SNOWFLAKE_DATABASE=your_database

# Snowflake schema (default: PUBLIC)
SNOWFLAKE_SCHEMA=PUBLIC

# ----------------------------------------------------------------------------
# EXTERNAL APIS
# Third-party service credentials
# ----------------------------------------------------------------------------

# idiCORE API
IDICORE_CLIENT_ID=your_client_id
# IDICORE_CLIENT_SECRET=<your-secret>

# CCC/DNC Scrub API
# CCC_API_KEY=<your-api-key>
CCC_API_URL=https://api.ccc.com
CCC_BATCH_SIZE=50

# ----------------------------------------------------------------------------
# ETL CONFIGURATION
# Processing settings and feature flags
# ----------------------------------------------------------------------------

# Batch size for ETL processing (default: 200)
ETL_BATCH_SIZE=200

# Enable database-side filtering (default: true)
ETL_USE_DATABASE_FILTERING=true

# Enable batched DNC queries (default: true)
DNC_USE_BATCHED_QUERY=true

# ----------------------------------------------------------------------------
# WORKER CONFIGURATION
# Thread pool and concurrency settings
# ----------------------------------------------------------------------------

# CCC Workers
CCC_MIN_WORKERS=2
CCC_MAX_WORKERS=16
CCC_WORKERS_PER_BATCH=1.5

# idiCORE Workers
IDICORE_MIN_WORKERS=10
IDICORE_MAX_WORKERS=200

# ----------------------------------------------------------------------------
# NOTIFICATIONS
# NTFY push notification service
# ----------------------------------------------------------------------------

# Enable NTFY notifications (default: false)
NTFY_ENABLED=false

# NTFY server URL
NTFY_BASE_URL=http://ntfy:80

# NTFY topic name
NTFY_TOPIC=etl-alerts

# ----------------------------------------------------------------------------
# LOGGING
# Application logging configuration
# ----------------------------------------------------------------------------

# Log level: DEBUG, INFO, WARNING, ERROR (default: INFO)
LOG_LEVEL=INFO

# Enable JSON logging format (default: false)
LOG_JSON_FORMAT=false

# ----------------------------------------------------------------------------
# INFRASTRUCTURE
# Redis, Celery, and service configuration
# ----------------------------------------------------------------------------

# Redis URL for Celery broker
REDIS_URL=redis://localhost:6379/0

# Celery result backend
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# ============================================================================
# NOTES
# ============================================================================
#
# [SENSITIVE] variables are commented out - set them in actual .env file
# Never commit actual .env files to version control
#
# Required files (not in env):
# - backend/secrets/rsa_key.p8 - Snowflake private key
# - backend/secrets/google_credentials.json - Google API (if used)
#
# ============================================================================
```

### Step 5: Validate Against Actual Config
Compare generated file with actual config.py:
- Warn if variables in config.py are missing from template
- Note any variables with hardcoded defaults that should be env vars

## Output
- Created/Updated: `env.example` (or specified output file)
- Report: List of sensitive variables identified
- Warning: Any missing or outdated entries

## Validation Rules
| Pattern | Classification | Action |
|---------|---------------|--------|
| `*_PASSWORD` | Sensitive | Comment out, add [SENSITIVE] |
| `*_SECRET` | Sensitive | Comment out, add [SENSITIVE] |
| `*_KEY` | Sensitive | Comment out, add [SENSITIVE] |
| `*_TOKEN` | Sensitive | Comment out, add [SENSITIVE] |
| `SecretStr` type | Sensitive | Comment out, add [SENSITIVE] |

## Error Handling
- If config.py not found, error with path suggestion
- If parsing fails, show partial results with errors
- If output file exists, ask before overwriting

## Related Commands
- For security audit: `/security-review`
- For deployment: `/pre-deploy`

## Example
```
/generate-env-config
```
Generates env.example from current config.py settings.

```
/generate-env-config .env.staging.example
```
Generates staging-specific environment template.
