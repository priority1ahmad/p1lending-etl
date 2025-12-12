---
allowed-tools: Read, Grep, Glob
description: Perform security review on codebase
---

## Security Review Checklist

### 1. Secrets Exposure
Search for hardcoded secrets:
- API keys, passwords, tokens in code
- .env files committed to git
- Credentials in config files

### 2. Authentication
Review @backend/app/api/v1/deps.py and @backend/app/core/security.py:
- JWT token validation
- Password hashing strength
- Token expiration settings

### 3. Authorization
Check endpoint protection in @backend/app/api/v1/endpoints/:
- All endpoints require authentication
- Role-based access where needed

### 4. Input Validation
Review Pydantic schemas in @backend/app/schemas/:
- All inputs validated
- No SQL injection vectors
- XSS prevention

### 5. CORS & Headers
Check @backend/app/main.py:
- CORS origins restricted
- Security headers present

### 6. WebSocket Security
Review @backend/app/websockets/job_events.py:
- Authentication on connection
- CORS restrictions

### 7. Docker Security
Review Dockerfiles and docker-compose files:
- Non-root users
- No secrets in images
- Health checks present
