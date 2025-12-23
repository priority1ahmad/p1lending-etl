# Component Development Guidelines

## Critical Rule

**ALWAYS check Storybook FIRST before creating or modifying any component.**

Steps before creating a component:
1. Check existing components in `ui/`, `features/`, `layout/`, `common/`
2. Review component APIs and patterns in existing code
3. Create story FIRST, then implement component

## Component Checklist

Before creating a component:
- [ ] Searched for similar existing components
- [ ] Created story file first (ComponentName.stories.tsx)
- [ ] Defined all props with TypeScript interfaces
- [ ] Added JSDoc comments for complex props
- [ ] Included loading/error/empty states where applicable

## File Structure

```
ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.stories.tsx # Storybook stories
├── ComponentName.test.tsx   # Unit tests (optional but recommended)
└── index.ts                 # Barrel export
```

Or for simpler components:
```
ComponentName.tsx
ComponentName.stories.tsx
```

## Directory Organization

- `ui/` - Base UI components (Button, Card, StatusBadge, etc.)
- `features/` - Feature-specific components (dashboard/, jobs/, results/, etl/)
- `layout/` - Layout components (Sidebar, Layout, Header)
- `common/` - Shared utility components

## Styling Rules

- Use Material UI (MUI) components and sx prop
- Follow existing theme patterns in `src/theme/`
- Support responsive design with MUI breakpoints
- Use `rem` units for spacing (converted from theme spacing)
- No inline styles outside of sx prop

## State Management

- Local state: `useState` for component-specific state
- Shared state: Zustand stores in `src/stores/`
- Server state: TanStack Query (React Query)

## TypeScript Requirements

- Define explicit interfaces for all props
- Export types for reusable prop interfaces
- Use strict typing (avoid `any`)

## Story Requirements

Every component MUST have a `.stories.tsx` file with:
- Default story showing typical usage
- Stories for different states (loading, error, empty)
- Stories showing prop variations
- "InContext" story showing real-world usage in a layout

Example:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // props
  },
};
```

## Results Page Requirements

Components for /results must:
- Handle loading states gracefully (skeleton loaders)
- Show meaningful empty states with actions
- Display errors with retry options
- Support pagination for large datasets
- Be responsive (mobile-first approach)
