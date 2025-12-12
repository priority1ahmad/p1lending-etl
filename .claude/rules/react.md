---
paths: frontend/src/**/*.tsx, frontend/src/**/*.ts
---

# React Rules

## Component Structure
- One component per file
- Use functional components with hooks
- Props interface defined above component
- Export at bottom of file

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
