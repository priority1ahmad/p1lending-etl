# Create Component with Storybook

Create a new React component with Storybook story.

## Input
$ARGUMENTS = Component name (PascalCase)

## Critical First Step
**ALWAYS call Storybook MCP FIRST**:
1. `list-all-components` - Check if similar component exists
2. `get-component-docs` - Review existing patterns

## Process

### Step 1: Check Existing Components
Use Storybook MCP to verify component doesn't already exist.

### Step 2: Create Story First
Create `src/components/$ARGUMENTS/$ARGUMENTS.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { $ARGUMENTS } from './$ARGUMENTS';

const meta: Meta<typeof $ARGUMENTS> = {
  title: 'Components/$ARGUMENTS',
  component: $ARGUMENTS,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof $ARGUMENTS>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Error: Story = {
  args: { error: 'Something went wrong' },
};
```

### Step 3: Create Component
Create `src/components/$ARGUMENTS/$ARGUMENTS.tsx`:

```tsx
import React from 'react';

export interface $ARGUMENTSProps {
  // Define props
}

export const $ARGUMENTS: React.FC<$ARGUMENTSProps> = (props) => {
  return (
    <div>
      {/* Implementation */}
    </div>
  );
};
```

### Step 4: Create Types (if complex)
Create `src/components/$ARGUMENTS/$ARGUMENTS.types.ts` if needed.

### Step 5: Create Test
Create `src/components/$ARGUMENTS/$ARGUMENTS.test.tsx`

### Step 6: Create Index
Create `src/components/$ARGUMENTS/index.ts`:
```tsx
export { $ARGUMENTS } from './$ARGUMENTS';
export type { $ARGUMENTSProps } from './$ARGUMENTS';
```

### Step 7: Verify in Storybook
```bash
npm run storybook
# Check component renders correctly in all states
```
