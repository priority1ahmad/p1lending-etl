# Prototype Command

You are helping the user create a prototype for a feature following the Universal Development Process (see `.claude/workflows/DEVELOPMENT_PROCESS.md`).

## Your Task

Execute **Phase 4** of the development process: Prototyping

## Prerequisites

- User story must exist (`.claude/plans/user-story-{slug}.md`)
- Implementation plan must exist (`.claude/plans/ISSUE-{number}-{slug}.md`)
- Implementation plan must be approved
- GitHub issue must exist and be in "Ready for Prototype" status

## Process

### Step 1: Load Context
Read the implementation plan:
```
.claude/plans/ISSUE-{issue-number}-{slug}.md
```

Understand:
- What components need to be created
- Expected user interactions
- Design requirements

### Step 2: Create UI Components (if applicable)

For **frontend features:**

1. **Create component files** in appropriate location:
   ```
   frontend/src/components/{category}/{ComponentName}/{ComponentName}.tsx
   ```

2. **Create Storybook stories** (MANDATORY):
   ```
   frontend/src/components/{category}/{ComponentName}/{ComponentName}.stories.tsx
   ```

3. **Include multiple story variants:**
   - Default state
   - Loading state
   - Error state
   - Disabled state
   - With data (real-world example)
   - In context (how it looks in actual UI)

4. **Follow existing patterns:**
   - Use MUI components
   - Follow design system
   - Use existing UI components from `src/components/ui/`
   - Check similar components for reference

5. **Start Storybook:**
   ```bash
   cd frontend && npm run storybook
   ```
   Access at: http://173.255.232.167:6006

### Step 3: Create Backend Prototype (if applicable)

For **backend features:**

1. **Document API contracts:**
   - Create mock endpoint specification
   - Define request/response schemas
   - Document error codes
   - Show example payloads

2. **Create sample data:**
   - Mock response examples
   - Edge case examples
   - Error response examples

3. **Optionally create mock endpoint:**
   - Temporary endpoint that returns mock data
   - Allows frontend to integrate without full backend

### Step 4: Present Prototype

**For UI features:**
1. Start Storybook server
2. Present URL to user: `http://173.255.232.167:6006`
3. List components created
4. Explain interactions and states
5. Highlight design decisions

**For backend features:**
1. Share API documentation
2. Show request/response examples
3. Explain business logic flow
4. Highlight security considerations

### Step 5: Gather Feedback

Ask user:
- Does this match their expectations?
- Any changes to functionality?
- Any changes to design/UX?
- Any missing states or edge cases?
- Performance concerns?

### Step 6: Iterate

If changes requested:
1. Update components/stories
2. Update API documentation
3. Re-present
4. Repeat until approved

### Step 7: Update Issue

Mark in GitHub issue:
```markdown
## Prototype Complete

### UI Components Created
- {ComponentName1}: {Purpose}
- {ComponentName2}: {Purpose}

### Storybook URL
http://173.255.232.167:6006

### API Documentation
[Link or paste documentation]

### Screenshots
[Add screenshots if helpful]

### Approval Status
- [ ] Awaiting review
- [ ] Approved by Solutions Engineer
- [ ] Changes requested

### Next Steps
Once approved, move to implementation phase.
```

## Output Format

```markdown
# Prototype Complete

## Components Created

### Frontend
- `{ComponentPath}` - {Purpose}
- `{StoryPath}` - {Story variants}

### Backend
- API: `{Method} {Path}` - {Purpose}
- Documentation: [Link]

## Storybook Preview
URL: http://173.255.232.167:6006
Stories created: {count}

## Key Features Demonstrated
- {Feature 1}
- {Feature 2}
- {Feature 3}

## States Covered
- ✅ Default
- ✅ Loading
- ✅ Error
- ✅ Empty
- ✅ With data
- ✅ In context

## Review Checklist
- [ ] Matches user story acceptance criteria
- [ ] Follows design system
- [ ] Accessible (keyboard, screen reader)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Error handling visible
- [ ] Loading states clear

## Next Steps
1. **Review prototype** at http://173.255.232.167:6006
2. **Provide feedback** (changes or approval)
3. **Approve** to move to implementation
4. Run `/implement {issue-number}` when ready

**Ready for review!** Please test the prototype and let me know if any changes are needed.
```

## Important Notes

- **ALWAYS create Storybook stories** for UI components (non-negotiable)
- Include minimum 5 story variants (default, loading, error, with data, in context)
- Use existing component patterns from the codebase
- Ensure responsive design (test mobile, tablet, desktop)
- Consider accessibility (keyboard navigation, ARIA labels)
- Show edge cases (empty states, long text, many items)
- Get approval before moving to implementation

## For Non-UI Features

If the feature doesn't have UI (backend-only, API, ETL logic):
- Create detailed API documentation
- Provide example requests/responses
- Document business logic flow
- Create sequence diagrams if helpful
- Skip to implementation plan review

## Example Usage

```
User: /prototype 42
AI: [Loads ISSUE-42 plan]
AI: [Creates UI components and stories]
AI: [Starts Storybook]
AI: Prototype ready! View at http://173.255.232.167:6006
AI: [Presents components and gathers feedback]
```
