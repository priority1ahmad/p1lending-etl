# Fix GitHub Issue Workflow

Fix a specific GitHub issue.

## Input
$ARGUMENTS = GitHub issue number

## Process

### Step 1: Fetch Issue Details
Use GitHub MCP to get issue #$ARGUMENTS details:
- Title
- Description
- Labels
- Comments

### Step 2: Analyze
- Understand the problem
- Identify affected files
- Check for related issues

### Step 3: Reproduce (if bug)
- Write a failing test that demonstrates the issue
- Verify the test fails

### Step 4: Fix
- Implement the fix
- Ensure the test now passes
- Check for regressions

### Step 5: Commit
```
git commit -m "fix: [description]

Fixes #$ARGUMENTS"
```

### Step 6: Create PR
Use GitHub MCP to create PR:
- Reference the issue
- Describe the fix
- Request review if needed
