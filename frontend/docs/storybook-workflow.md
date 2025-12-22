# Storybook Workflow

## Before Creating Any Component

1. **Check Storybook MCP First**
   ```
   Use storybook-mcp: list-all-components
   ```

2. **Review Similar Components**
   ```
   Use storybook-mcp: get-component-docs ComponentName
   ```

3. **If Creating New Component**:
   - Create story file FIRST
   - Define all states (default, loading, error, empty)
   - Implement component to match story
   - Verify in Storybook before committing

## Story Requirements

Every component story must include:
- [ ] Default state
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)
- [ ] Empty state (if applicable)
- [ ] Edge cases (long text, many items, etc.)

## Component Structure

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.stories.tsx  # Stories (create FIRST!)
├── ComponentName.test.tsx     # Tests
└── index.ts                   # Barrel export
```

## Accessing Storybook on Linode

SSH Tunnel:
```bash
ssh -L 6006:localhost:6006 aallouch@173.255.232.167
```

Then visit: http://localhost:6006

Or direct access (if firewall allows):
```
http://173.255.232.167:6006
```
