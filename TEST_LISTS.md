# Testing Litigator and DNC Lists

This guide explains how to test the Litigator and DNC list functionality in production.

## Quick Start

Run the interactive test script:

```bash
bash test-lists.sh
```

Or run tests directly:

```bash
# Test litigator list only
docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_litigator_list.py

# Test DNC list only
docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_dnc_list.py

# Test both lists
docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_both_lists.py
```

## Important: Docker Container Paths

⚠️ **The scripts are located at `/app/scripts/` in the Docker container**, not `/app/backend/scripts/`.

The Dockerfile copies the backend code to `/app`, so:
- Local path: `backend/scripts/test_litigator_list.py`
- Docker path: `/app/scripts/test_litigator_list.py`

## What the Tests Do

### Litigator List Test (`test_litigator_list.py`)
- Tests CCC API service initialization
- Checks phone numbers against the litigator list
- Verifies caching functionality
- Shows statistics and results

### DNC List Test (`test_dnc_list.py`)
- Tests DNC database connectivity
- Checks phone numbers against the DNC database
- Verifies database structure
- Shows statistics and results

### Combined Test (`test_both_lists.py`)
- Runs both litigator and DNC tests
- Provides comprehensive verification

## Troubleshooting

### Error: "can't open file '/app/backend/scripts/...'"

**Solution:** Use the correct path `/app/scripts/` instead of `/app/backend/scripts/`

```bash
# ❌ Wrong
docker compose -f docker-compose.prod.yml exec -T backend python /app/backend/scripts/test_both_lists.py

# ✅ Correct
docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_both_lists.py
```

### Error: "ModuleNotFoundError"

Make sure you're running the script inside the Docker container, not on the host:

```bash
docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/test_litigator_list.py
```

### Error: "Backend container is not running"

Start the containers first:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Expected Output

When tests run successfully, you should see:

```
======================================================================
  LITIGATOR LIST TEST
======================================================================

✅ CCC API Service initialized
   API URL: https://dataapi.dncscrub.com/v1.4/scrub/litigator
   Batch Size: 20

Testing 6 phone numbers:
  1. 5551234567
  2. (555) 123-4567
  ...

Results:
  1. 5551234567
     ✅ NOT in list (Confidence: 85%)
  ...

SUMMARY
----------------------------------------------------------------------
Total phones tested:     6
Successful checks:        6
Errors:                   0
Found in litigator list:  0
Cached results:          0
Cache hit rate:         0.0%
```

## Modifying Test Phone Numbers

You can edit the test scripts to use your own phone numbers:

1. Edit `backend/scripts/test_litigator_list.py` or `backend/scripts/test_dnc_list.py`
2. Modify the `test_phones` list
3. Rebuild the Docker container or copy the updated script into the running container

