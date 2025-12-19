# Universal Development Process
## P1Lending ETL - Claude Code Workflow

**Version:** 1.0.0
**Last Updated:** 2025-12-17

---

## Overview

This document defines the **universal development process** for all Claude Code interactions across modes, skills, agents, and human developers. If work is not tracked in GitHub Issues/Projects, it does not exist.

### Core Principles

1. **Issue-Driven Development** - Every feature, bug, or enhancement lives in GitHub Issues
2. **Plan Before Implement** - Thorough planning reduces rework and bugs
3. **Prototype First** - Validate UI/UX with stakeholders before full implementation
4. **Document Everything** - CHANGELOG.md + DOCUMENTATION.md updated with every change
5. **Quality Gates** - Automated checks + human review before production
6. **Continuous Integration** - Every push triggers CI/CD pipeline
7. **Safe Deployments** - Staging validation before production

---

## Workflow Phases

### Phase 1: Concept & Discovery

**Trigger:** Feedback, user request, bug report, or new idea

**Process:**
1. **Gather Context**
   - AI asks clarifying questions (use `/recommend` for features)
   - Understand the "why" behind the request
   - Identify affected users/systems

2. **Research & Articulation**
   - AI explores codebase (Explore agent)
   - Visualizes current vs desired state
   - Articulates the problem/opportunity clearly
   - Identifies dependencies and risks

3. **Create User Story**
   - AI drafts user story using template (see below)
   - Includes acceptance criteria
   - Estimates complexity (Small/Medium/Large/XL)

**Outputs:**
- User story document
- Context research notes
- Initial risk assessment

---

### Phase 2: GitHub Issue Creation

**Process:**
1. AI creates GitHub Issue with:
   - Title: `[FEATURE|BUG|ENHANCEMENT] Clear description`
   - Labels: `feature`, `bug`, `enhancement`, `security`, etc.
   - Milestone: Release version if applicable
   - User story content (template below)
   - Linked to GitHub Project board

2. AI adds issue to project board in **"Backlog"** column

3. Solutions Engineer reviews and moves to **"Ready for Planning"** if approved

**GitHub Project Structure:**
```
Columns:
- Backlog (new issues)
- Ready for Planning (approved)
- In Planning (AI working)
- Ready for Prototype (plan approved)
- In Prototype (Storybook/mockup)
- Ready for Review (prototype done)
- In Implementation (coding)
- In QA (staging testing)
- Done (merged to prod)
```

**Critical Rule:** If it's not in an issue with a project board card, it does not exist.

---

### Phase 3: Planning & Design

**Process:**
1. **Move issue to "In Planning"**

2. **AI creates implementation plan:**
   - Use `/recommend` for feature planning
   - Break into sub-tasks
   - Identify files to create/modify
   - List dependencies
   - Design data models/API contracts
   - Plan testing strategy
   - Estimate effort

3. **Create planning document:**
   ```
   .claude/plans/ISSUE-{number}-{slug}.md
   ```

4. **Solutions Engineer Review:**
   - Reviews plan for completeness
   - Checks architectural alignment
   - Approves or requests changes

5. **Move to "Ready for Prototype"** when approved

**Outputs:**
- Implementation plan document
- Technical design notes
- Task breakdown in GitHub Issue

---

### Phase 4: Prototyping

**For UI Features:**
1. **Move issue to "In Prototype"**

2. **AI creates Storybook stories:**
   - Component structure mockup
   - Variants and states
   - Interactive playground
   - Run: `npm run storybook` (http://173.255.232.167:6006)

3. **AI creates wireframes/mockups if needed**

4. **Present to Solutions Engineer:**
   - Share Storybook URL
   - Demo interactions
   - Discuss UX decisions

5. **Iterate based on feedback:**
   - Make recommended changes
   - Update stories
   - Re-present until approved

6. **Move to "Ready for Review"** when approved

**For Backend Features:**
1. API contract documentation
2. Sample request/response payloads
3. Database schema diagram
4. Similar review/approval process

**Outputs:**
- Storybook stories (UI)
- API documentation (Backend)
- Approved prototype

---

### Phase 5: Implementation

**Process:**
1. **Move issue to "In Implementation"**

2. **Create feature branch:**
   ```bash
   git checkout -b feature/ISSUE-{number}-{short-description}
   # Examples:
   # feature/ISSUE-42-dark-mode
   # bugfix/ISSUE-38-login-timeout
   # enhancement/ISSUE-55-api-caching
   ```

3. **AI implements using slash commands:**
   - `/add-endpoint` for API endpoints
   - `/add-migration` for database changes
   - `/add-react-page` for React pages
   - `/add-full-stack-feature` for complete features
   - `/lint all --fix` before committing

4. **Write tests:**
   - Backend: pytest with >80% coverage
   - Frontend: React Testing Library for critical paths
   - Integration tests for APIs
   - Run: `pytest --cov=app` (backend)

5. **Update documentation:**
   - Add entry to `CHANGELOG.md` (see format below)
   - Update `DOCUMENTATION.md` (architecture, APIs, usage)
   - Update inline code comments/docstrings
   - Update `CLAUDE.md` if workflow changes

6. **AI runs pre-commit checks:**
   - `/lint all --fix`
   - Type checking (TypeScript build, mypy)
   - Tests pass locally
   - No security vulnerabilities

7. **Commit with structured message:**
   ```
   [ISSUE-{number}] Type: Brief description

   - Detailed change 1
   - Detailed change 2

   Addresses #{issue-number}
   ```

8. **Push to feature branch:**
   ```bash
   git push origin feature/ISSUE-{number}-{short-description}
   ```

9. **Create Pull Request:**
   - Title: `[ISSUE-{number}] Description`
   - Description includes:
     - Links to issue
     - Summary of changes
     - Testing performed
     - Screenshots/videos (UI changes)
     - Breaking changes (if any)
   - Assign reviewers
   - Link to issue (closes #{number})

**Outputs:**
- Feature branch with commits
- Pull request
- Updated CHANGELOG.md
- Updated DOCUMENTATION.md
- Test coverage report

---

### Phase 6: Code Review

**Process:**
1. **Automated Checks (CI/CD):**
   - Backend: Ruff, Black, pytest
   - Frontend: ESLint, TypeScript build
   - Security: Trivy, Bandit
   - All must pass ✅

2. **Human Review:**
   - Solutions Engineer reviews code
   - Checks against plan
   - Verifies tests
   - Confirms documentation updated
   - Requests changes if needed

3. **AI addresses feedback:**
   - Makes requested changes
   - Pushes updates to branch
   - Responds to review comments

4. **Approval:**
   - At least 1 approving review required
   - All CI checks passing
   - No merge conflicts

**Outputs:**
- Approved pull request ready to merge

---

### Phase 7: QA/Staging

**Process:**
1. **Merge PR to `staging` branch:**
   ```bash
   git checkout staging
   git merge --no-ff feature/ISSUE-{number}-{short-description}
   git push origin staging
   ```

2. **Move issue to "In QA"**

3. **CI/CD deploys to staging:**
   - Automated deployment to staging server
   - Health checks run
   - Smoke tests execute

4. **Manual QA Testing:**
   - Test acceptance criteria from user story
   - Verify no regressions
   - Check performance
   - Browser/device testing (UI)
   - Edge case validation

5. **If bugs found:**
   - Create bug issue
   - Fix on staging branch
   - Re-test
   - Do NOT merge to production until clean

6. **Staging Sign-Off:**
   - Solutions Engineer approves staging
   - Product Owner confirms (if applicable)

**Outputs:**
- Staging deployment
- QA test results
- Approval to deploy production

---

### Phase 8: Production Deployment

**Process:**
1. **Create production PR:**
   - From `staging` to `main`
   - Title: `Release: [version] - [date]`
   - Includes CHANGELOG entries
   - Lists all issues included

2. **Final Review:**
   - Solutions Engineer reviews
   - Checks for any last-minute concerns

3. **Merge to `main`:**
   ```bash
   git checkout main
   git merge --no-ff staging
   git tag -a v{version} -m "Release {version}"
   git push origin main --tags
   ```

4. **CI/CD deploys to production:**
   - Automated deployment
   - Database migrations (Alembic)
   - Health checks
   - Smoke tests

5. **Post-Deployment Verification:**
   - Monitor logs for errors
   - Check key metrics (response times, error rates)
   - Verify critical user flows work
   - Keep staging deployment running for quick rollback

6. **Move issue to "Done"**

7. **Close GitHub Issue with notes:**
   ```
   Deployed in v{version}

   Changes:
   - [summary]

   Testing:
   - [what was tested]

   Deployed: [timestamp]
   ```

**Outputs:**
- Production deployment
- Git tag for release
- Closed GitHub Issues
- Release notes

---

### Phase 9: Monitoring & Iteration

**Process:**
1. **Monitor for 24-48 hours:**
   - Error rates
   - Performance metrics
   - User feedback

2. **If issues arise:**
   - Follow hotfix process (see below)

3. **Gather feedback:**
   - User satisfaction
   - Performance data
   - Lessons learned

4. **Update issue with post-deployment notes**

---

## Special Processes

### Hotfix Process (Production Bugs)

**When:** Critical bug affecting production users

**Process:**
1. Create issue with `[HOTFIX]` prefix and `critical` label
2. Create hotfix branch from `main`:
   ```bash
   git checkout -b hotfix/ISSUE-{number}-{description} main
   ```
3. Fix bug (minimal changes only)
4. Test locally + write test to prevent regression
5. PR to `main` with expedited review
6. Deploy immediately upon approval
7. Backport fix to `staging` branch
8. Post-mortem: Document what happened and how to prevent

### Documentation Update Process

**CHANGELOG.md Format:**
```markdown
## [Version] - YYYY-MM-DD

### Added
- [ISSUE-123] New feature description

### Changed
- [ISSUE-124] Updated existing feature

### Fixed
- [ISSUE-125] Bug fix description

### Security
- [ISSUE-126] Security improvement
```

**DOCUMENTATION.md Structure:**
- Keep synchronized with codebase
- Update architecture diagrams
- Document new APIs/endpoints
- Add usage examples
- Update deployment steps
- Keep table of contents current

### Rollback Process

**When:** Production deployment causes critical issues

**Process:**
1. Immediately rollback to previous version:
   ```bash
   git checkout v{previous-version}
   # Deploy previous version
   ```
2. Create incident issue
3. Fix bug following hotfix process
4. Document incident and prevention steps

---

## Templates

### User Story Template

```markdown
## User Story
As a [role], I want [feature], so that [benefit].

## Background
[Context about why this is needed]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Considerations
- Dependencies: [list]
- Risks: [list]
- Performance impact: [description]

## Design Notes
[Wireframes, API contracts, etc.]

## Definition of Done
- [ ] Code implemented and reviewed
- [ ] Tests written and passing (>80% coverage)
- [ ] Documentation updated (CHANGELOG + DOCUMENTATION)
- [ ] Storybook stories created (UI features)
- [ ] QA testing passed in staging
- [ ] Security review passed (if applicable)
- [ ] Performance benchmarks met
- [ ] Deployed to production
- [ ] Post-deployment monitoring (48hrs)

## Complexity Estimate
[Small | Medium | Large | XL]
```

### Implementation Plan Template

```markdown
# Implementation Plan: [Feature Name]

**Issue:** #[number]
**Complexity:** [Small/Medium/Large/XL]
**Estimated Effort:** [hours/days]

## Overview
[Brief description]

## Files to Create
- [ ] `path/to/file.py` - Purpose

## Files to Modify
- [ ] `path/to/file.ts` - Changes needed

## Database Changes
- [ ] Migration: [description]
- [ ] Models: [list]

## API Changes
- [ ] New endpoints: [list]
- [ ] Modified endpoints: [list]
- [ ] Breaking changes: [yes/no]

## Frontend Changes
- [ ] New components: [list]
- [ ] Modified components: [list]
- [ ] New pages: [list]

## Testing Strategy
- [ ] Unit tests: [description]
- [ ] Integration tests: [description]
- [ ] E2E tests: [description]

## Documentation Updates
- [ ] CHANGELOG.md entry
- [ ] DOCUMENTATION.md sections
- [ ] API documentation
- [ ] Inline comments

## Dependencies
- [List any blockers or prerequisites]

## Risks
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

## Rollback Plan
[How to undo changes if needed]
```

---

## Automation

### Claude Code Hooks

**Auto-format** (`.claude/hooks/auto-format.sh`):
- Runs Black, Ruff, Prettier after edits
- Already implemented ✅

**Update Changelog** (`.claude/hooks/update-changelog.py`):
- Prompts AI to add CHANGELOG.md entry
- Triggers on Write/Edit in app code
- Exists but needs activation ✅

**Update Documentation** (`.claude/hooks/update-docs.py`):
- Prompts AI to update DOCUMENTATION.md
- Triggers on major changes
- Exists but needs activation ✅

**GitHub Issue Creation** (new):
```bash
.claude/hooks/create-github-issue.py
```
- Auto-creates issue from user story
- Adds to project board
- Returns issue URL

### Claude Code Slash Commands

**Workflow Commands** (to create):

- `/start-feature <name>` - Runs Phase 1-3 (concept → planning)
- `/prototype <issue-number>` - Runs Phase 4 (prototyping)
- `/implement <issue-number>` - Runs Phase 5-6 (implementation + review)
- `/deploy-staging` - Runs Phase 7 (QA/Staging)
- `/deploy-prod` - Runs Phase 8 (Production)
- `/hotfix <issue-number>` - Expedited critical fix process

**Already Exists:**
- `/lint` - Code quality checks ✅
- `/pre-deploy` - Pre-deployment validation ✅
- `/security-review` - Security audit ✅
- `/recommend` - Feature planning ✅

---

## Quality Gates

### Pre-Commit
- [ ] Code formatted (Black, Prettier)
- [ ] No linting errors (Ruff, ESLint)
- [ ] Type checking passes
- [ ] Tests pass locally

### Pre-PR
- [ ] All acceptance criteria met
- [ ] Test coverage >80%
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met

### Pre-Staging
- [ ] CI pipeline passes
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Breaking changes documented

### Pre-Production
- [ ] Staging testing complete
- [ ] No critical bugs
- [ ] Performance validated
- [ ] Rollback plan ready

---

## Metrics & Success Criteria

**Track:**
- Lead time (concept → production)
- Deployment frequency
- Change failure rate
- Time to restore (rollback time)
- Test coverage %
- Bug escape rate (bugs found in prod)
- Cycle time per phase

**Goals:**
- Deploy to staging: < 3 days from approval
- Deploy to production: < 1 week from staging
- Test coverage: > 80%
- Bug escape rate: < 5%
- CI pipeline: < 10 minutes
- Rollback time: < 15 minutes

---

## Branch Strategy

```
main (production)
  ↑
staging (QA environment)
  ↑
feature/ISSUE-{number}-{description}
bugfix/ISSUE-{number}-{description}
enhancement/ISSUE-{number}-{description}
hotfix/ISSUE-{number}-{description} → main (direct)
```

**Rules:**
- No direct commits to `main` or `staging`
- All work in feature branches
- PR required for all merges
- Squash commits optional (team preference)
- Delete branches after merge

---

## AI Agent Guidelines

**When Claude Code is invoked:**

1. **Check for existing issue:** Ask user for issue number
2. **If no issue exists:** Run Phase 1-2 (create issue)
3. **Use appropriate agent:**
   - Explore: Codebase research
   - Plan: Architecture design
   - API Architect: API design review
   - ETL Specialist: ETL debugging
4. **Follow workflow phases** sequentially
5. **Update todo list** to track progress
6. **Document in parallel** (don't defer to end)
7. **Ask for approval** at phase transitions
8. **Mark issue complete** when deployed

**Universal across all modes:**
- Planning mode: Create implementation plan (Phase 3)
- Implementation mode: Follow Phase 5-6
- Review mode: Phase 6 review checklist
- All modes: Update CHANGELOG + DOCUMENTATION

---

## Getting Started Checklist

**To activate this process:**

- [ ] Create GitHub Project board with columns
- [ ] Enable hooks: `update-changelog.py`, `update-docs.py`
- [ ] Create workflow slash commands
- [ ] Train team on process
- [ ] Create first issue using template
- [ ] Run pilot feature through full workflow
- [ ] Gather feedback and iterate
- [ ] Update this document based on learnings

---

## Questions & Clarifications

**Q: What if a change is too small for this process?**
A: Small bug fixes (<30min) can skip prototyping (Phase 4) but still need issue, plan, tests, and documentation.

**Q: Who is "Solutions Engineer"?**
A: Tech lead / senior developer who approves plans and reviews PRs. Can be same person as Product Owner for small teams.

**Q: Can we skip staging?**
A: No. Staging catches issues before production. Hotfixes can expedite but still test in staging-like environment.

**Q: How to handle urgent requests?**
A: Use hotfix process. Still create issue and document, but expedite review and deploy directly to main.

**Q: What if AI makes a mistake?**
A: Human review at Phase 6 catches issues. If deployed, follow rollback process and create bug issue.

---

**This is a living document. Update as the process evolves.**
