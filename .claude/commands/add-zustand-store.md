---
allowed-tools: Read, Write, Edit, Glob
description: Create a new Zustand store with persistence following project patterns
argument-hint: <store-name>
---

## Task
Create a new Zustand store following the pattern established in `authStore.ts`, including TypeScript types, persistence middleware, and DevTools support.

## Supported Arguments
- `<store-name>` - Name of the store (e.g., "settings", "jobs", "filters")

## Workflow

### Step 1: Analyze Existing Pattern
Read the reference implementation:
- `@frontend/src/stores/authStore.ts` - Primary pattern reference

Key patterns to replicate:
- TypeScript interface for state
- Separate interface for actions
- `persist` middleware with localStorage
- `devtools` middleware for debugging
- Typed `useStore` hook export

### Step 2: Create Store File
Create `frontend/src/stores/{storeName}Store.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// State interface
interface {StoreName}State {
  // Add state properties
  isLoading: boolean;
  error: string | null;
  // ... domain-specific state
}

// Actions interface
interface {StoreName}Actions {
  // Add action methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  // ... domain-specific actions
}

// Combined type
type {StoreName}Store = {StoreName}State & {StoreName}Actions;

// Initial state
const initialState: {StoreName}State = {
  isLoading: false,
  error: null,
  // ... initial values
};

// Store creation
export const use{StoreName}Store = create<{StoreName}Store>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
        // ... action implementations
      }),
      {
        name: '{store-name}-storage', // localStorage key
        partialize: (state) => ({
          // Only persist specific fields (exclude loading/error)
          // ... fields to persist
        }),
      }
    ),
    { name: '{StoreName}Store' } // DevTools name
  )
);
```

### Step 3: Export from Index (if exists)
If `frontend/src/stores/index.ts` exists, add export:
```typescript
export { use{StoreName}Store } from './{storeName}Store';
```

### Step 4: Create Usage Example
Add comment at top of store file:
```typescript
/**
 * {StoreName} Store
 *
 * Usage:
 * ```tsx
 * import { use{StoreName}Store } from '@/stores/{storeName}Store';
 *
 * function MyComponent() {
 *   const { isLoading, setLoading } = use{StoreName}Store();
 *   // or for selective subscription:
 *   const isLoading = use{StoreName}Store((state) => state.isLoading);
 * }
 * ```
 */
```

## Output
- Created: `frontend/src/stores/{storeName}Store.ts`
- Pattern: Zustand + persist + devtools
- TypeScript: Fully typed state and actions

## Error Handling
- If store already exists, warn and ask before overwriting
- If stores directory doesn't exist, create it

## Related Commands
- For API integration: `/add-api-service`
- For new pages using store: `/add-react-page`

## Example
```
/add-zustand-store settings
```
Creates `frontend/src/stores/settingsStore.ts` with Settings state management.
