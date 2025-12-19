# Feature Development Guide

This guide explains how to use the recommendation agent and Storybook to develop frontend features efficiently while maintaining UI/UX consistency.

## Table of Contents

1. [MANDATORY: Storybook Requirement](#mandatory-storybook-requirement)
2. [Recommendation Agent](#recommendation-agent)
3. [Storybook Component Playground](#storybook-component-playground)
4. [Complete Development Workflow](#complete-development-workflow)
5. [Best Practices](#best-practices)

---

## MANDATORY: Storybook Requirement ⭐

**CRITICAL RULE FOR ALL REACT COMPONENTS:**

Every new React component **MUST** have a `.stories.tsx` file created alongside it. This is **NOT OPTIONAL**.

### Requirements
- Create story file with same name: `ComponentName.stories.tsx`
- Include minimum 3-5 story variants:
  - Default/basic story
  - All state variations (loading, disabled, error, etc.)
  - All prop variants (colors, sizes, etc.)
  - At least one "in context" example showing real-world usage
- Follow existing story patterns in `src/components/`
- Add `tags: ['autodocs']` for automatic documentation generation

### Why This Matters
- **Visual Documentation**: Living component catalog
- **Faster Development**: Test components without running full app
- **Design Consistency**: Ensure components follow design system
- **Better Testing**: Isolated component testing
- **Team Collaboration**: Designers can review components independently

### Storybook Access
```
http://173.255.232.167:6006
```

### Reference Examples
- `src/components/features/dashboard/*.stories.tsx` - Dashboard components
- `src/components/features/jobs/*.stories.tsx` - Job management components
- `src/components/ui/*.stories.tsx` - Base UI components

**When in doubt, refer to existing stories for patterns!**

---

## Recommendation Agent

### What is it?

The recommendation agent (`/recommend`) is an interactive AI assistant that helps you plan and implement features by:
- Asking clarifying questions about your requirements
- Analyzing the codebase for relevant patterns
- Suggesting specific tools, commands, and components
- Providing a step-by-step implementation plan

### When to use it?

Use `/recommend` whenever you:
- Want to build a new feature but aren't sure of the best approach
- Need guidance on which components/patterns to use
- Want to ensure you're following established conventions
- Are unfamiliar with part of the codebase

### How to use it?

1. **Run the command:**
   ```bash
   /recommend
   ```

2. **Describe what you want to build:**
   ```
   I want to add a user activity log page that shows all actions users take
   ```

3. **Answer the questions:**
   The agent will ask clarifying questions like:
   - What type of feature is this?
   - What data does it work with?
   - Who will use it?
   - Does it need real-time updates?
   - How complex is the UI?

4. **Review the recommendations:**
   You'll receive:
   - Feature analysis (type, complexity, estimated components)
   - Recommended slash commands and tools
   - Reusable components to leverage
   - Step-by-step implementation plan
   - Reference files to copy patterns from
   - Important considerations (security, performance, testing)

5. **Choose your path:**
   - Let the agent implement it for you
   - Implement it yourself following the recommendations

### Example Interaction

```
User: /recommend

Agent: What would you like to build?

User: I want to add a user activity log page

Agent: Great! Let me ask a few questions to provide the best recommendations:

1. Should this show all users' activity (admin only) or just the current user's activity?
2. What actions should be logged? (logins, ETL jobs, file uploads, etc.)
3. Should it have filtering by date range, user, or action type?
4. Do you need export functionality (CSV/Excel)?
5. Real-time updates or static table with refresh?

User: [Provides answers...]

Agent: [Provides comprehensive recommendations with specific file paths,
       components, patterns, and implementation plan]
```

### What you get from the agent:

#### 1. Feature Analysis
- Feature type classification
- Complexity assessment
- Component estimation

#### 2. Recommended Tools
- Specific slash commands to use
- Agents to leverage
- External tools if needed

#### 3. Reusable Components
- Frontend UI components (Card, Button, etc.)
- Backend services and utilities
- API endpoint patterns

#### 4. Implementation Plan
- Backend steps with file references
- Frontend steps with file references
- Integration steps
- Testing approach

#### 5. Reference Files
- Exact file paths to copy patterns from
- Code snippets from existing implementations

#### 6. Considerations
- Security requirements
- Performance optimizations
- Testing strategies
- Documentation needs

---

## Storybook Component Playground

### What is it?

Storybook is an industry-standard tool for developing and testing UI components in isolation. It provides:
- Live component preview with hot reload
- Interactive controls to modify props
- Multiple viewport sizes (mobile, tablet, desktop)
- Visual documentation of all component variants
- Shareable component library

### Why use it?

✅ **Preview before integration** - See components in isolation before adding to pages
✅ **Rapid iteration** - Instant hot reload as you make changes
✅ **Explore variants** - See all button colors, card styles, badge types at once
✅ **Consistent design** - Ensure components match the design system
✅ **Documentation** - Auto-generated docs for all components
✅ **Team collaboration** - Designers can preview components without running the app

### How to use it?

#### Starting Storybook

```bash
cd frontend
npm run storybook
```

Storybook will open at `http://173.255.232.167:6006`

#### Exploring Components

1. **Navigate the sidebar** - Browse components by category (UI, Features, etc.)
2. **View stories** - Each component has multiple "stories" showing different variants
3. **Use controls** - Modify props in real-time using the Controls panel
4. **Change viewport** - Test responsive behavior with viewport toolbar
5. **Check accessibility** - Use the A11y addon to catch accessibility issues

#### Current Components with Stories

**Dashboard Components** (`Features/Dashboard/`)
- DashboardMetricCard - KPI metric cards with icons and trends
- QuickActionCard - Large action buttons for navigation
- ProcessingTrendsChart - Bar charts for processing volume trends
- ComplianceDonutChart - Donut charts for compliance breakdown

**Job Management Components** (`Features/Jobs/`)
- JobCreationCard - Job configuration form
- ActiveJobMonitor - Real-time job progress monitoring

**Base UI Components** (`UI/`)
All core UI components have complete stories:

**Card Component** (`UI/Card`)
- Default
- With Title
- Elevated
- Ghost
- Hoverable
- With Actions
- With Header Action
- No Padding
- Large Padding

**Button Component** (`UI/Button`)
- All color schemes (Primary, Accent, Success, Warning, Error)
- All variants (Solid, Outline, Ghost, Link)
- With icons
- Loading states
- Disabled state
- Size variations
- Full width

**StatusBadge Component** (`UI/StatusBadge`)
- Job statuses (Running, Completed, Failed, Cancelled, Pending)
- Compliance statuses (Clean, Litigator, DNC, Both)
- With/without icons
- Custom labels
- In-context examples

#### Creating New Stories

When you create a new component, add a story file:

```tsx
// MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Features/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    // Define controls for props
    variant: {
      control: 'select',
      options: ['default', 'highlighted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Example',
    variant: 'default',
  },
};

export const Highlighted: Story = {
  args: {
    title: 'Example',
    variant: 'highlighted',
  },
};
```

#### Storybook Structure

```
frontend/
├── .storybook/
│   ├── main.ts           # Storybook configuration
│   └── preview.tsx       # Global decorators (theme, providers)
└── src/
    └── components/
        └── ui/
            ├── Card/
            │   ├── Card.tsx
            │   └── Card.stories.tsx  ← Stories here
            ├── Button/
            │   ├── Button.tsx
            │   └── Button.stories.tsx
            └── Badge/
                ├── StatusBadge.tsx
                └── StatusBadge.stories.tsx
```

### Features Included

#### 1. MUI Theme Integration
All stories use your custom MUI theme automatically, so colors, typography, and spacing match your app.

#### 2. React Query Provider
Stories have access to React Query, so you can test components that use `useQuery` or `useMutation`.

#### 3. Notification Provider
The SnackbarProvider is available, so you can test components that use `useNotification()`.

#### 4. Background Options
Switch between different backgrounds (light, secondary, dark) to test component contrast.

#### 5. Addons Enabled
- **Controls** - Modify props interactively
- **Actions** - Log component events (onClick, onChange, etc.)
- **Viewport** - Test responsive behavior
- **Docs** - Auto-generated documentation
- **Interactions** - Test user interactions

### Building Storybook for Deployment

```bash
npm run build-storybook
```

This creates a static site in `storybook-static/` that can be deployed for team collaboration.

---

## Complete Development Workflow

Here's the recommended workflow combining both tools:

### 1. Plan the Feature

```bash
/recommend
```

Describe what you want to build and answer the agent's questions.

### 2. Review Recommendations

The agent provides:
- Which components to use
- Which patterns to follow
- Step-by-step plan

### 3. Preview Components in Storybook

Before implementation:

```bash
npm run storybook
```

- Explore existing components (Card, Button, StatusBadge, etc.)
- See all variants and how to use them
- Test props and interactions
- Choose the right components for your feature

### 4. Implement Backend (if needed)

Follow the agent's recommendations:

```bash
/add-endpoint <name> <method>
# or
/add-migration <desc>
```

### 5. Implement Frontend

#### Option A: Use slash commands
```bash
/add-react-page <PageName>
# or
/add-full-stack-feature <name>
```

#### Option B: Manual implementation
Follow the agent's step-by-step plan with referenced file paths.

### 6. Develop UI Components in Storybook

**Iterative development:**

1. Create/modify component in `src/components/`
2. Add/update story in `ComponentName.stories.tsx`
3. Run Storybook to preview
4. Iterate quickly with hot reload
5. Once satisfied, integrate into page

### 7. Test Integration

Run the app and test the feature end-to-end:

```bash
npm run dev
```

### 8. Create Story for New Components

If you created a new component, add a story so others can preview it:

```tsx
// NewComponent.stories.tsx
export default {
  title: 'Features/NewComponent',
  component: NewComponent,
  tags: ['autodocs'],
};

export const Default = {
  args: { /* default props */ },
};
```

### 9. Lint and Test

```bash
/lint frontend --fix
```

---

## Best Practices

### When to Use the Recommendation Agent

✅ **DO use** for:
- New feature planning
- Unfamiliar parts of the codebase
- Ensuring best practices
- Getting unstuck
- Learning established patterns

❌ **DON'T use** for:
- Simple typo fixes
- Obvious one-line changes
- Tasks you fully understand

### When to Use Storybook

✅ **DO use** for:
- Developing new UI components
- Testing component variants
- Previewing before integration
- Documenting component APIs
- Sharing with designers/team
- Visual regression testing

❌ **DON'T use** for:
- Backend logic testing
- Integration testing (use the app)
- API endpoint testing
- Database testing

### Combining Both Tools

**Best workflow:**

1. `/recommend` → Get plan and component recommendations
2. Storybook → Preview and test recommended components
3. Implement → Build the feature using recommended patterns
4. Storybook → Create stories for new components
5. Test → Verify integration in running app

### Component Development Pattern

```
1. Plan      → /recommend
2. Explore   → Storybook (existing components)
3. Create    → Write component code
4. Preview   → Storybook (new story)
5. Iterate   → Hot reload in Storybook
6. Integrate → Add to page
7. Document  → Update story with all variants
```

### Maintaining Consistency

The recommendation agent will always suggest:
- ✅ Using existing components
- ✅ Following established patterns
- ✅ Leveraging theme tokens
- ✅ Matching UI/UX conventions

Storybook helps you:
- ✅ See all component options
- ✅ Test with your theme
- ✅ Ensure consistent styling
- ✅ Document variations

### Tips for Success

1. **Start with `/recommend`** - Even if you think you know the approach, the agent might suggest better patterns

2. **Explore Storybook first** - Before creating a new component, check if something similar exists

3. **Create stories early** - Don't wait until the end; create stories as you develop components

4. **Use interactive controls** - Test all prop combinations in Storybook before hardcoding

5. **Reference existing stories** - Copy patterns from Card, Button, or StatusBadge stories

6. **Keep stories simple** - Each story should showcase one variant or use case

7. **Add context examples** - Include "in context" stories showing real-world usage

8. **Document edge cases** - Create stories for loading, error, and empty states

---

## Quick Reference

### Commands

| Command | Purpose |
|---------|---------|
| `/recommend` | Get feature implementation recommendations |
| `npm run storybook` | Start Storybook on port 6006 |
| `npm run build-storybook` | Build static Storybook site |
| `/add-react-page <name>` | Create new page |
| `/add-full-stack-feature <name>` | Create complete feature |
| `/lint frontend --fix` | Fix linting issues |

### Storybook URLs

- **Local:** http://localhost:6006
- **Stories location:** `src/**/*.stories.tsx`
- **Config:** `.storybook/main.ts`
- **Theme setup:** `.storybook/preview.tsx`

### Key Files

| File | Purpose |
|------|---------|
| `.claude/commands/recommend.md` | Recommendation agent prompt |
| `.storybook/main.ts` | Storybook configuration |
| `.storybook/preview.tsx` | Global theme/provider setup |
| `Card.stories.tsx` | Card component examples |
| `Button.stories.tsx` | Button component examples |
| `StatusBadge.stories.tsx` | Badge component examples |

---

## Next Steps

1. **Try the recommendation agent:**
   ```bash
   /recommend
   ```
   Describe a feature you want to build

2. **Explore Storybook:**
   ```bash
   cd frontend && npm install && npm run storybook
   ```
   Browse the UI components

3. **Build something:**
   Use both tools together to create a new feature following the complete workflow

---

**Questions?** The recommendation agent can help explain any part of this workflow. Just ask!
