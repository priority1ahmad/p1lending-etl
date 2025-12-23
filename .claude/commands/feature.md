# Feature Development Workflow

Develop a new feature end-to-end.

## Input
$ARGUMENTS = Feature description

## Process

### Step 1: Research
- Use Context7 MCP to check relevant documentation
- Search existing codebase for similar patterns
- Check Storybook for reusable components (if frontend)

### Step 2: Planning
- Break feature into subtasks
- Identify files to create/modify
- List required tests
- Estimate complexity

### Step 3: Architecture Decision
If this is a significant feature, use Sequential Thinking MCP to:
- Evaluate different approaches
- Consider trade-offs
- Document the decision

### Step 4: Implementation
For each component:
1. If frontend: Create Storybook story FIRST
2. Write tests (TDD approach)
3. Implement the feature
4. Verify tests pass

### Step 5: Quality Checks
- Run linter: `npm run lint`
- Run tests: `npm run test`
- Check for console.logs

### Step 6: Documentation
- Update relevant CLAUDE.md sections
- Add to CHANGELOG.md [Unreleased] section

### Step 7: Commit and PR
- Use conventional commit format
- Create PR via GitHub MCP
- Link to relevant issues

## Output
- Working feature with tests
- Storybook stories (if frontend)
- Updated documentation
- Pull request created
