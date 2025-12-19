---
paths: frontend/src/**/*.tsx, frontend/src/**/*.ts
---

# React Rules

## Component Structure
- One component per file
- Use functional components with hooks
- Props interface defined above component
- Export at bottom of file

## Storybook Requirement ⭐
**CRITICAL:** Every new component MUST have a Storybook story

- When creating a new component, ALWAYS create a `.stories.tsx` file alongside it
- Story file should include:
  - Basic default story
  - All prop variants (different states, colors, sizes)
  - Loading/disabled/error states
  - At least one "in context" story showing real-world usage
  - Grid/layout example if the component is meant to be used in groups
- Follow the pattern from existing stories in `src/components/`
- Story file naming: `ComponentName.stories.tsx`
- Use `Meta` and `StoryObj` types from `@storybook/react`
- Add `tags: ['autodocs']` for automatic documentation

### Example Story Structure:
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Features/Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    // Control definitions
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    // Default props
  },
};

// More variants...
```

## State Management
- Auth state: Zustand (authStore)
- Server state: TanStack Query
- Form state: Local useState or react-hook-form
- Avoid prop drilling - use context or stores

## Styling
- Use MUI components from theme
- Consistent spacing with theme.spacing()
- Responsive design with breakpoints
- Dark mode support via theme

## Performance
- Memoize expensive computations (useMemo)
- Memoize callbacks passed to children (useCallback)
- Lazy load pages with React.lazy()
