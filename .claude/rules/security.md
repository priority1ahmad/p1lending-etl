---
paths: **/*.py, **/*.ts
---

# Security Rules

## NEVER DO
- Hardcode credentials, API keys, or secrets
- Log sensitive data (passwords, tokens, PII)
- Use eval() or exec() with user input
- Disable SSL verification in production
- Use wildcard CORS origins in production

## ALWAYS DO
- Validate all user input with Pydantic
- Use parameterized queries (SQLAlchemy handles this)
- Hash passwords with bcrypt (passlib)
- Set secure cookie flags
- Validate JWT tokens on every request
- Use HTTPS in production
