---
allowed-tools: Read, Write, Edit, Glob
description: Create a frontend API service with auth and error handling
argument-hint: <service-name>
---

## Task
Create a new frontend API service following the patterns in `frontend/src/services/api/`, including TypeScript types, axios integration, and proper error handling.

## Supported Arguments
- `<service-name>` - Name of the service (e.g., "users", "reports", "notifications")

## Workflow

### Step 1: Analyze Existing Patterns
Read reference implementations:
- `@frontend/src/services/api/jobs.ts` - CRUD operations pattern
- `@frontend/src/services/api/scripts.ts` - Simple service pattern
- `@frontend/src/utils/api.ts` - Axios instance configuration

Key patterns:
- Use shared axios instance from `utils/api`
- TypeScript interfaces for request/response
- Async/await with proper error handling
- RESTful endpoint naming

### Step 2: Create Type Definitions
Create or update `frontend/src/types/{serviceName}.ts`:

```typescript
// Request types
export interface Create{ServiceName}Request {
  // ... request fields
}

export interface Update{ServiceName}Request {
  // ... update fields
}

// Response types
export interface {ServiceName}Response {
  id: string;
  created_at: string;
  updated_at: string;
  // ... response fields
}

export interface {ServiceName}ListResponse {
  items: {ServiceName}Response[];
  total: number;
  page: number;
  page_size: number;
}
```

### Step 3: Create API Service
Create `frontend/src/services/api/{serviceName}.ts`:

```typescript
import api from '@/utils/api';
import type {
  Create{ServiceName}Request,
  Update{ServiceName}Request,
  {ServiceName}Response,
  {ServiceName}ListResponse,
} from '@/types/{serviceName}';

const BASE_URL = '/api/v1/{service-name}';

/**
 * {ServiceName} API Service
 * Handles all {service-name} related API operations
 */

// List all
export const get{ServiceName}List = async (
  page = 1,
  pageSize = 20
): Promise<{ServiceName}ListResponse> => {
  const response = await api.get(BASE_URL, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

// Get by ID
export const get{ServiceName}ById = async (
  id: string
): Promise<{ServiceName}Response> => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

// Create
export const create{ServiceName} = async (
  data: Create{ServiceName}Request
): Promise<{ServiceName}Response> => {
  const response = await api.post(BASE_URL, data);
  return response.data;
};

// Update
export const update{ServiceName} = async (
  id: string,
  data: Update{ServiceName}Request
): Promise<{ServiceName}Response> => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// Delete
export const delete{ServiceName} = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};
```

### Step 4: Create TanStack Query Hooks (Optional)
If using TanStack Query, create `frontend/src/hooks/use{ServiceName}.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  get{ServiceName}List,
  get{ServiceName}ById,
  create{ServiceName},
  update{ServiceName},
  delete{ServiceName},
} from '@/services/api/{serviceName}';

export const {serviceName}Keys = {
  all: ['{serviceName}'] as const,
  lists: () => [...{serviceName}Keys.all, 'list'] as const,
  list: (params: object) => [...{serviceName}Keys.lists(), params] as const,
  details: () => [...{serviceName}Keys.all, 'detail'] as const,
  detail: (id: string) => [...{serviceName}Keys.details(), id] as const,
};

export const use{ServiceName}List = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: {serviceName}Keys.list({ page, pageSize }),
    queryFn: () => get{ServiceName}List(page, pageSize),
  });
};

export const use{ServiceName} = (id: string) => {
  return useQuery({
    queryKey: {serviceName}Keys.detail(id),
    queryFn: () => get{ServiceName}ById(id),
    enabled: !!id,
  });
};

export const useCreate{ServiceName} = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create{ServiceName},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {serviceName}Keys.lists() });
    },
  });
};

export const useUpdate{ServiceName} = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => update{ServiceName}(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: {serviceName}Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: {serviceName}Keys.lists() });
    },
  });
};

export const useDelete{ServiceName} = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: delete{ServiceName},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {serviceName}Keys.lists() });
    },
  });
};
```

### Step 5: Update Index Export
Add to `frontend/src/services/api/index.ts`:
```typescript
export * from './{serviceName}';
```

## Output
- Created: `frontend/src/services/api/{serviceName}.ts`
- Created: `frontend/src/types/{serviceName}.ts`
- Optional: `frontend/src/hooks/use{ServiceName}.ts`

## Error Handling
- If service already exists, warn and ask before overwriting
- If corresponding backend endpoint doesn't exist, note in comments

## Related Commands
- For backend endpoint: `/add-endpoint`
- For state management: `/add-zustand-store`
- For UI components: `/add-react-page`

## Example
```
/add-api-service notifications
```
Creates notification API service with full CRUD operations.
