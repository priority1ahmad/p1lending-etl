---
allowed-tools: Read, Edit, Write, Glob
description: Create a new React page component
argument-hint: <page-name>
---

## Task
Create a new React page named `$1`.

## Requirements
1. Create page component in `frontend/src/pages/$1.tsx`
2. Follow existing patterns from @frontend/src/pages/Dashboard.tsx
3. Use MUI components from the theme
4. Add route in `frontend/src/App.tsx`
5. Use TanStack Query for data fetching if needed
6. Include TypeScript types

## Patterns to Follow
- Protected routes wrap with ProtectedRoute
- Use Layout component for consistent navigation
- API calls go through services/api/
- State management: Zustand for auth, TanStack Query for server state
