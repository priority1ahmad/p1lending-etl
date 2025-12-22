# ETL Pipeline Test Workflow

Test the ETL pipeline.

## Input
$ARGUMENTS = Test scope (full|extract|transform|load|api)

## Process

### Step 1: Environment Check
Verify we're in development environment:
```bash
echo $APP_ENV  # Must be 'development'
```

### Step 2: Run Tests Based on Scope

**full**: Run complete ETL pipeline with test data
```bash
python src/etl/run.py --env development --test
```

**extract**: Test Snowflake extraction only
```bash
pytest tests/integration/test_extract.py -v
```

**transform**: Test data transformations
```bash
pytest tests/unit/test_transform.py -v
```

**load**: Test loading back to Snowflake
```bash
pytest tests/integration/test_load.py -v
```

**api**: Test API enrichment calls
```bash
pytest tests/integration/test_api_enrichment.py -v
```

### Step 3: Report Results
- Show pass/fail summary
- Highlight any errors
- Report execution time
