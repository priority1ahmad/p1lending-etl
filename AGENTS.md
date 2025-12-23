# Custom Claude Code Agents

This document lists all custom slash commands (agents) available for the P1Lending ETL project.

---

## Quick Reference

### Single-Task Agents

| Command | Category | Purpose |
|---------|----------|---------|
| `/review-endpoint` | Code Review | Review a FastAPI endpoint |
| `/review-security` | Code Review | Security audit |
| `/generate-tests` | Testing | Generate tests for a module |
| `/add-pytest` | Testing | Set up pytest infrastructure |
| `/debug-etl` | Debugging | Debug ETL job failures |
| `/trace-job` | Debugging | Trace ETL job execution flow |
| `/add-endpoint` | Feature Dev | Scaffold new FastAPI endpoint |
| `/add-etl-service` | Feature Dev | Add external service integration |
| `/add-react-page` | Feature Dev | Scaffold new React page |
| `/add-migration` | DevOps | Create database migration |
| `/pre-deploy` | DevOps | Pre-deployment checklist |
| `/create-pr` | Git | Generate PR description |
| `/review-pr` | Git | Review a pull request |

### Composite Agents (Multi-Step Workflows)

| Command | Purpose |
|---------|---------|
| `/full-feature` | End-to-end feature implementation |
| `/ship-it` | Complete deployment workflow |
| `/investigate` | Full issue investigation |

---

## Agent Details

### Code Review & Quality

#### `/review-endpoint <endpoint>`

Review a FastAPI endpoint for security, performance, and project pattern adherence.

**Usage:**
```bash
/review-endpoint backend/app/api/v1/endpoints/jobs.py
/review-endpoint auth
```

**Features:**
- Security checks (auth, injection, validation)
- Async pattern verification
- Pydantic schema review
- Performance analysis
- Structured output with severity levels

**Files Referenced:**
- `backend/app/api/v1/deps.py`
- `backend/app/core/security.py`
- `backend/app/schemas/`

---

#### `/review-security [component]`

Comprehensive security audit of the application or specific component.

**Usage:**
```bash
/review-security                    # Full audit
/review-security backend/app/core/  # Specific path
```

**Checks:**
- Authentication & JWT implementation
- Injection vulnerabilities (SQL, command)
- Secrets management
- CORS configuration
- Docker security
- Dependency vulnerabilities

**Output:** Security report with CRITICAL/HIGH/LOW findings

---

### Testing

#### `/generate-tests <target>`

Generate comprehensive tests for a Python or React module.

**Usage:**
```bash
/generate-tests backend/app/api/v1/endpoints/jobs.py
/generate-tests backend/app/services/etl/engine.py
/generate-tests frontend/src/pages/Dashboard.tsx
```

**Generates:**
- pytest tests for Python (with async support)
- Vitest tests for React components
- Appropriate mocks for external services

**Prerequisites:** Run `/add-pytest` first if no test infrastructure exists.

---

#### `/add-pytest`

Set up complete pytest testing infrastructure from scratch.

**Usage:**
```bash
/add-pytest
```

**Creates:**
- `backend/tests/` directory structure
- `conftest.py` with fixtures (db, client, auth)
- Sample tests for health and auth endpoints
- `pytest.ini` configuration
- Updates to `requirements.txt`

---

### Debugging & ETL

#### `/debug-etl <problem>`

Analyze and debug ETL job failures.

**Usage:**
```bash
/debug-etl Job stuck at 45%
/debug-etl idiCORE returning empty results
/debug-etl DNC check not working
```

**Features:**
- Diagnostic flowchart for common issues
- Service-by-service testing commands
- Common error pattern lookup
- Root cause analysis template

**Files Referenced:**
- `backend/app/services/etl/*.py`
- `backend/app/workers/etl_tasks.py`
- `backend/app/core/config.py`

---

#### `/trace-job <job_id>`

Trace complete ETL job flow from API to completion.

**Usage:**
```bash
/trace-job abc123-def456
/trace-job "the last failed job"
```

**Shows:**
- Timeline of all execution stages
- Data flow through pipeline
- WebSocket events emitted
- Database state changes

---

### Feature Development

#### `/add-endpoint <description>`

Scaffold a new FastAPI endpoint with full CRUD operations.

**Usage:**
```bash
/add-endpoint GET /api/v1/stats - return job statistics
/add-endpoint schedules resource for recurring jobs
```

**Creates:**
- Endpoint file with CRUD operations
- Pydantic request/response schemas
- Database model
- Router registration
- Alembic migration (if new table)

---

#### `/add-etl-service <description>`

Add a new external service integration to the ETL pipeline.

**Usage:**
```bash
/add-etl-service Email validation (ZeroBounce API)
/add-etl-service Property data enrichment
```

**Creates:**
- Service class in `services/etl/`
- Configuration in `config.py`
- Environment variables in `env.example`
- Test script
- Integration points

---

#### `/add-react-page <description>`

Scaffold a new React page with project patterns.

**Usage:**
```bash
/add-react-page Job History - past ETL jobs with filtering
/add-react-page User Management admin page
```

**Creates:**
- Page component with TanStack Query
- Route in `App.tsx`
- Navigation link
- API service functions

---

### DevOps & Deployment

#### `/add-migration <description>`

Create an Alembic database migration.

**Usage:**
```bash
/add-migration Add scheduled_jobs table
/add-migration Add status column to sql_scripts
```

**Creates:**
- Model file (if new table)
- Alembic migration file
- Tests upgrade/downgrade

---

#### `/pre-deploy [target]`

Run comprehensive pre-deployment verification.

**Usage:**
```bash
/pre-deploy              # General check
/pre-deploy production   # Production-specific
```

**Verifies:**
- Environment configuration
- Secrets files
- Docker configuration
- Database migrations
- External service connectivity
- Security checklist

---

### Git Workflow

#### `/create-pr [context]`

Generate a well-structured pull request.

**Usage:**
```bash
/create-pr
/create-pr Closes #42 - Preview feature
```

**Outputs:**
- Analyzed change summary
- PR title and description
- Ready-to-run `gh pr create` command

---

#### `/review-pr <reference>`

Review a pull request thoroughly.

**Usage:**
```bash
/review-pr 42
/review-pr feature/add-scheduling
```

**Reviews:**
- Code quality and patterns
- Security considerations
- Test coverage
- Documentation

---

## Composite Agents

These agents chain multiple tasks for complete workflows.

### `/full-feature <description>`

**End-to-end feature implementation workflow.**

**Usage:**
```bash
/full-feature Add job scheduling with cron expressions
/full-feature User roles and permissions
```

**Workflow:**
1. **Plan** - Analyze requirements, identify components
2. **Backend** - Create endpoints, models, migrations
3. **Frontend** - Create pages, components
4. **Review** - Security and code review
5. **Test** - Generate tests
6. **Document** - Update CLAUDE.md, env.example
7. **PR** - Create pull request

---

### `/ship-it [target]`

**Complete deployment workflow with all checks.**

**Usage:**
```bash
/ship-it
/ship-it production
```

**Phases:**
1. **Pre-Flight** - Git status, branch sync
2. **Code Quality** - Security, lint, build
3. **Testing** - Automated and manual tests
4. **Pre-Deploy** - Full checklist
5. **Create PR** - Generate PR
6. **Deploy** - Post-merge deployment steps

**Outputs:** Ship-ready report with go/no-go decision

---

### `/investigate <issue>`

**Full issue investigation workflow.**

**Usage:**
```bash
/investigate Jobs failing with KeyError
/investigate Slow response on preview endpoint
/investigate Users getting logged out randomly
```

**Phases:**
1. **Gather** - Collect error info, logs, reproduce
2. **Analyze** - Trace flow, identify root cause
3. **Fix** - Implement and review fix
4. **Verify** - Test fix, check regressions
5. **Document** - Update error handling, known issues

**Outputs:** Investigation report with root cause and resolution

---

## Agent Architecture

### Common Sections in All Agents

Each enhanced agent includes:

1. **Pre-Flight Checks** - Validate inputs, check prerequisites
2. **Required File References** - Specific files to read
3. **Step-by-Step Instructions** - Detailed guidance
4. **Output Format** - Structured report template
5. **Error Handling** - Common errors and resolutions
6. **Validation Steps** - Verify completion

### Error Handling Patterns

All agents handle these common scenarios:

| Error | Agent Response |
|-------|----------------|
| File not found | List alternatives, ask for clarification |
| Missing dependencies | Suggest prerequisite agent (e.g., `/add-pytest`) |
| Ambiguous input | Ask clarifying questions |
| Security issue found | Stop and report before proceeding |

### Validation Patterns

All agents include validation:

- [ ] Pre-conditions met
- [ ] Actions completed successfully
- [ ] No errors introduced
- [ ] Output matches expectations

---

## Creating Custom Agents

### File Location

Create markdown files in `.claude/commands/`:

```
.claude/commands/
├── review-endpoint.md
├── review-security.md
├── generate-tests.md
├── ...
└── your-new-agent.md
```

### Template

```markdown
# Agent Name

Description of what this agent does.

## Input
$ARGUMENTS

---

## Pre-Flight Checks

1. Verify prerequisites
2. Check inputs

**Error handling:**
```
❌ ERROR: Description
Resolution: How to fix
```

---

## Required File References

| File | Purpose |
|------|---------|
| `path/to/file` | Why it's needed |

---

## Instructions

### Step 1: First Action
{detailed instructions}

### Step 2: Next Action
{detailed instructions}

---

## Output Format

```markdown
# Report Title

## Section 1
{template}

## Validation Checklist
- [ ] Item 1
- [ ] Item 2
```

---

## Error Handling

| Error | Resolution |
|-------|------------|
| Error type | How to fix |

---

## Validation Steps

1. Verify action 1
2. Verify action 2
```

---

## Usage Tips

1. **Use Arguments**: Replace `$ARGUMENTS` with specific input
2. **Chain Agents**: Use composite agents for complex tasks
3. **Follow Output**: Agents provide structured reports and checklists
4. **Validate Results**: Always run the validation steps

---

*Last updated: December 2024*
