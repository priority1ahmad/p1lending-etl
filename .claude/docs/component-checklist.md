# Component Creation Checklist

Use this checklist **EVERY TIME** you create a new React component.

## ✅ Required Files

When creating a component named `MyComponent`:

```
src/components/[category]/MyComponent/
├── MyComponent.tsx          ✅ REQUIRED
├── MyComponent.stories.tsx  ✅ REQUIRED (MANDATORY!)
└── index.ts                 ✅ REQUIRED (for exports)
```

## ✅ Component File (`MyComponent.tsx`)

- [ ] TSDoc comment describing the component
- [ ] Props interface defined above component
- [ ] Component uses TypeScript strict types
- [ ] Uses MUI components from theme
- [ ] Follows design system (colors from `palette`, spacing from theme)
- [ ] Includes example usage in TSDoc
- [ ] Component exported at bottom
- [ ] Uses functional component with hooks

**Example:**
```tsx
/**
 * MyComponent - Brief description
 * Longer description if needed
 */

import { Box, Typography } from '@mui/material';
import { palette } from '../../../theme';

export interface MyComponentProps {
  /** Prop description */
  title: string;
  /** Prop description */
  onClick?: () => void;
}

/**
 * Component description
 *
 * @example
 * <MyComponent title="Hello" onClick={handleClick} />
 */
export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <Box onClick={onClick}>
      <Typography>{title}</Typography>
    </Box>
  );
}

export default MyComponent;
```

## ✅ Stories File (`MyComponent.stories.tsx`) - MANDATORY!

- [ ] Imports `Meta` and `StoryObj` from `@storybook/react`
- [ ] Meta object with title, component, tags, argTypes
- [ ] `tags: ['autodocs']` for automatic documentation
- [ ] Default export of meta
- [ ] Type definition: `type Story = StoryObj<typeof MyComponent>;`
- [ ] **Minimum 3-5 stories:**
  - [ ] Default/basic story
  - [ ] All state variants (loading, disabled, error, etc.)
  - [ ] All prop variants (colors, sizes, types, etc.)
  - [ ] "In Context" story showing real-world usage
  - [ ] Grid/layout story if component is used in groups
- [ ] Each story has descriptive name
- [ ] Uses real-looking data (not "foo", "bar", "test")

**Example:**
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Features/Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Component title',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

// Minimum required stories:

export const Default: Story = {
  args: {
    title: 'Default Example',
  },
};

export const WithClick: Story = {
  args: {
    title: 'Clickable',
    onClick: () => alert('Clicked!'),
  },
};

export const InContext: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Real-world Example
      </Typography>
      <MyComponent title="In Use" onClick={() => {}} />
    </Box>
  ),
};
```

## ✅ Index File (`index.ts`)

- [ ] Exports component
- [ ] Exports types/interfaces
- [ ] Clean barrel export pattern

**Example:**
```tsx
export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

## ✅ After Creation

- [ ] Run Storybook: `npm run storybook`
- [ ] Navigate to your component in Storybook sidebar
- [ ] Verify all stories render correctly
- [ ] Test all interactive states
- [ ] Check responsive behavior (if applicable)
- [ ] Review accessibility (A11y tab in Storybook)

## ✅ Storybook Access

```
http://173.255.232.167:6006
```

## 🚫 Common Mistakes to Avoid

- ❌ Creating component WITHOUT creating stories (MANDATORY!)
- ❌ Using generic test data ("foo", "bar", "test")
- ❌ Only creating one story (need multiple variants)
- ❌ Not showing "in context" usage
- ❌ Hardcoding colors instead of using theme palette
- ❌ Missing TypeScript types
- ❌ Not exporting from index.ts

## 📚 Reference Examples

**Best Story Examples:**
- `src/components/features/dashboard/DashboardMetricCard.stories.tsx` (15 stories!)
- `src/components/features/dashboard/QuickActionCard.stories.tsx` (8 stories)
- `src/components/features/jobs/ActiveJobMonitor.stories.tsx` (11 stories)
- `src/components/ui/Card/Card.stories.tsx` (9 stories)

**When creating a new component, ALWAYS reference these examples!**

---

## 📝 Quick Decision Tree

```
Creating a new React component?
    ↓
Are you creating BOTH .tsx AND .stories.tsx files?
    ↓
  NO → ❌ STOP! Stories are MANDATORY
    ↓
  YES → ✅ Continue
    ↓
Do your stories include:
  - Default story
  - State variants
  - Prop variants
  - "In context" example
    ↓
  NO → Add missing stories
    ↓
  YES → ✅ Good to go!
    ↓
Test in Storybook before integrating into pages
```
