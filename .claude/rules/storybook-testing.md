# Storybook Component Testing Rule

## Requirement

After creating or modifying React components with Storybook stories, **always verify components load correctly using Playwright**.

## When to Run

Run Playwright verification:
- After creating new components with stories
- After modifying existing component props or structure
- After fixing component bugs
- Before considering a component "complete"

## How to Test

Use a separate agent to run Playwright tests against Storybook:

```
Use Playwright to verify the following Storybook stories load correctly:
- [List story paths]

Storybook URL: http://173.255.232.167:6006

For each story:
1. Navigate to the story URL
2. Wait for page load (at least 2 seconds)
3. Take a snapshot to verify content renders
4. **CRITICAL: Check browser console for errors using browser_console_messages with level "error"**
5. Look for error patterns like "Cannot read properties of undefined" or React errors
6. Report pass/fail status with any error messages found
```

## Console Error Detection (CRITICAL)

**You MUST check for console errors on every story.** Use this approach:

```javascript
// After navigating to story, wait and check console
await browser_wait_for({ time: 2 });
const messages = await browser_console_messages({ level: "error" });
// Report any errors found - these indicate component failures
```

Common errors to detect:
- `Cannot read properties of undefined (reading 'X')` - Missing theme/prop values
- `TypeError: X is not a function` - Invalid callback props
- `Warning: Each child in a list should have a unique "key" prop` - React key errors
- `Uncaught Error: ...` - Any uncaught exceptions

## Story URL Format

Storybook story URLs follow this pattern:
```
http://173.255.232.167:6006/?path=/story/{category}-{component}--{story-name}
```

Examples:
- `?path=/story/features-home-activityfeed--default`
- `?path=/story/pages-dashboardhomepage--interactive-demo`

## What to Check

1. **Component Renders**: Page should show component content, not blank/error
2. **No Console Errors**: Browser console MUST be free of errors (check with browser_console_messages)
3. **Interactive Elements**: Buttons, inputs should be visible and properly styled
4. **Loading States**: Loading skeletons should render correctly

## Failure Response

If Playwright tests fail OR console errors are detected:
1. **Report the exact error message** from the console
2. Fix the component code (common fixes: wrong palette key, missing props, undefined values)
3. Re-run the Playwright verification
4. Do not mark component as complete until all tests pass AND console is error-free
