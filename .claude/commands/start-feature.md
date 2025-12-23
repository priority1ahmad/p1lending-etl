# Start Feature Command

You are helping the user start a new feature following the Universal Development Process (see `.claude/workflows/DEVELOPMENT_PROCESS.md`).

## Your Task

Execute **Phase 1-3** of the development process:
1. Concept & Discovery
2. GitHub Issue Creation
3. Planning & Design

## Process

### Step 1: Gather Context (Phase 1)
Ask the user clarifying questions to understand the feature:
- What problem are they trying to solve?
- Who are the users of this feature?
- What is the expected behavior?
- Are there any constraints or requirements?
- What is the priority? (Critical/High/Medium/Low)

Use the `/recommend` agent to help explore and articulate the concept if it's a complex feature.

### Step 2: Research Codebase
- Use Explore agent to understand existing patterns
- Identify files that will be affected
- Find similar features in the codebase
- Understand current architecture

### Step 3: Create User Story (Phase 2)
- Copy template from `.claude/templates/user-story.md`
- Fill in all sections based on your research
- Write clear acceptance criteria (3-5 testable criteria)
- Estimate complexity (Small/Medium/Large/XL)
- Document technical considerations
- Define clear Definition of Done

Save to: `.claude/plans/user-story-{feature-name-slug}.md`

### Step 4: Create GitHub Issue
**IMPORTANT:** Ask the user to create the GitHub issue manually with:
- Title: `[FEATURE] {Clear description}`
- Labels: `feature`, `{complexity}`, `{priority}`
- Body: Contents of the user story document
- Add to project board in "Backlog" column

Then ask the user for the issue number to continue.

### Step 5: Create Implementation Plan (Phase 3)
- Copy template from `.claude/templates/implementation-plan.md`
- Fill in all sections:
  - Overview and objectives
  - Architecture decisions
  - Detailed implementation steps (backend, frontend, testing)
  - Dependencies and risks
  - Timeline estimate
- Break down into subtasks
- Identify all files to create/modify

Save to: `.claude/plans/ISSUE-{number}-{feature-name-slug}.md`

### Step 6: Present Plan to User
Present a summary of:
- User story overview
- Key technical decisions
- Files to be created/modified
- Estimated effort (hours/days)
- Risks and mitigations
- Timeline

Ask for approval to proceed to prototyping phase.

### Step 7: Update Todo List
Create a todo list with:
- [ ] Prototype UI components (Storybook)
- [ ] Review prototype with stakeholder
- [ ] Implement backend changes
- [ ] Implement frontend changes
- [ ] Write tests
- [ ] Update documentation
- [ ] Code review
- [ ] QA testing
- [ ] Deploy to staging
- [ ] Deploy to production

## Output Format

```markdown
# Feature Planning Complete

## User Story Created
Location: `.claude/plans/user-story-{slug}.md`

## GitHub Issue
Issue #: {number}
URL: {github-url}
Status: Backlog → Ready for Planning

## Implementation Plan Created
Location: `.claude/plans/ISSUE-{number}-{slug}.md`

## Summary
**Feature:** {Name}
**Complexity:** {Small/Medium/Large/XL}
**Estimated Effort:** {X days}
**Priority:** {High/Medium/Low}

## Next Steps
1. Review and approve implementation plan
2. Move issue to "Ready for Prototype"
3. Run `/prototype {issue-number}` to start prototyping phase

## Key Technical Decisions
- {Decision 1}
- {Decision 2}
- {Decision 3}

## Files to Create/Modify
- Backend: {count} files
- Frontend: {count} files
- Tests: {count} files
- Docs: {count} files

**Ready to proceed?** Reply with "approve" or request changes.
```

## Important Notes
- Always follow the Universal Development Process
- Create comprehensive plans - don't skip sections
- Ask questions if anything is unclear
- Ensure acceptance criteria are testable
- Consider security and performance implications
- Plan for rollback and error handling

## Example Usage
```
User: /start-feature email notifications
AI: [Runs through Phase 1-3, creates user story and plan]
AI: Feature planning complete. Review the plan and approve to proceed to prototyping.
```
