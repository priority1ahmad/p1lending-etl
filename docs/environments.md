# Environment Strategy

## Overview

| Environment | Data Source | Snowflake | When to Use |
|-------------|-------------|-----------|-------------|
| Development | Mock JSON | Disabled | Local coding, unit tests |
| Staging | Production DB | CL36377 | Integration testing, demos |
| Production | Production DB | CL36377 | Live system |

## Quick Reference

### Development (mock data)
```bash
export APP_ENV=development
npm run dev
# Uses tests/fixtures/*.json
```

### Staging (real Snowflake)
```bash
export APP_ENV=staging
export SNOWFLAKE_USER=xxx
export SNOWFLAKE_PASSWORD=xxx
export SNOWFLAKE_DATABASE=xxx
export SNOWFLAKE_WAREHOUSE=xxx
npm run dev
```

## Mock Data

Located in `tests/fixtures/`. To regenerate:
```bash
python scripts/generate-test-data.py
```

## Environment Configuration

The environment is controlled by `VITE_APP_ENV` (frontend) and `APP_ENV` (backend):

- **development**: Uses mock data, no external API calls
- **staging**: Uses real Snowflake (CL36377) for integration testing
- **production**: Live system with full monitoring

## Key Files

- `frontend/src/config/environments.ts` - Environment configuration and helpers
- `frontend/src/services/mock-data.ts` - Mock data service for development
- `frontend/src/services/data-service.ts` - Unified data service with environment switching
- `tests/fixtures/*.json` - Mock data fixtures
- `scripts/generate-test-data.py` - Regenerate mock data

## Security Notes

- Never commit `.env.production` - production secrets go only in CI/CD
- `.env.staging` contains only non-sensitive configuration
- Snowflake credentials are always set via environment variables or CI/CD secrets
