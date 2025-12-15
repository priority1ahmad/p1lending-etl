---
paths: **/*.py, **/*.ts, **/*.tsx
---

# Security Rules

## Secrets Management

### NEVER DO
- Hardcode credentials, API keys, or secrets in code
- Commit `.env` files to version control
- Log sensitive data (passwords, tokens, PII)
- Store secrets in frontend code (exposed to client)
- Use default passwords in production

### ALWAYS DO
```python
# Load from environment
from app.core.config import settings

api_key = settings.API_KEY  # From env var
```

```python
# Mask sensitive values in logs
logger.info(f"Connecting to {settings.DB_HOST}:***")
```

## Authentication

### JWT Tokens
```python
# Set reasonable expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Not hours/days
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Validate on every request
current_user: User = Depends(get_current_user)

# Use secure algorithm
ALGORITHM = "HS256"
```

### Password Handling
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash passwords
hashed = pwd_context.hash(plain_password)

# Verify passwords
is_valid = pwd_context.verify(plain_password, hashed)
```

## Input Validation

### Pydantic Schemas
```python
from pydantic import BaseModel, Field, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase')
        return v
```

### SQL Injection Prevention
```python
# SAFE: SQLAlchemy ORM (parameterized)
result = await db.execute(select(User).where(User.email == email))

# SAFE: Parameterized query
result = await db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)

# DANGEROUS: String interpolation
# query = f"SELECT * FROM users WHERE email = '{email}'"  # NEVER!
```

## API Security

### CORS Configuration
```python
# Production: Specific origins only
CORS_ORIGINS = ["https://app.example.com"]

# NEVER in production
# CORS_ORIGINS = ["*"]  # Allows any origin
```

### Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/resource")
@limiter.limit("100/minute")
async def get_resource():
    ...
```

### Security Headers
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["app.example.com", "*.example.com"]
)

# Add security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

## WebSocket Security

```python
# Authenticate WebSocket connections
@sio.event
async def connect(sid, environ):
    token = environ.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
    try:
        user = verify_token(token)
        await sio.save_session(sid, {'user_id': user.id})
    except Exception:
        return False  # Reject connection
```

## Docker Security

```dockerfile
# Run as non-root user
RUN useradd -m appuser
USER appuser

# Don't expose unnecessary ports
EXPOSE 8000

# Use secrets, not env vars for sensitive data
# docker run --secret db_password ...
```

## Examples in Codebase
- JWT auth: `backend/app/core/security.py`
- Password hashing: `backend/app/core/security.py`
- Pydantic validation: `backend/app/schemas/`
- CORS config: `backend/app/main.py`

## Security Checklist
- [ ] No secrets in code or logs
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens with short expiration
- [ ] All inputs validated
- [ ] CORS restricted to known origins
- [ ] WebSocket authenticated
- [ ] Docker runs as non-root
- [ ] HTTPS in production
