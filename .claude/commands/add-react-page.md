# Add New React Page

Scaffold a new page component following project patterns.

## Page Description
$ARGUMENTS

## Instructions

### 1. Create Page Component

Create new file in `frontend/src/pages/`:

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuthStore } from '../stores/authStore';

// API functions
const fetchData = async () => {
  const response = await api.get('/api/v1/resource');
  return response.data;
};

export const NewPage = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Fetch data with TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['resource'],
    queryFn: fetchData,
    enabled: isAuthenticated,
  });

  // Mutation example
  const mutation = useMutation({
    mutationFn: (newData) => api.post('/api/v1/resource', newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load data: {error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Page Title
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {/* Page content */}
      </Paper>
    </Container>
  );
};

export default NewPage;
```

### 2. Add Route

Update `frontend/src/App.tsx`:

```typescript
import { NewPage } from './pages/NewPage';

// Inside Routes component:
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### 3. Add Navigation

Update `frontend/src/components/layout/AppBar.tsx`:

```typescript
// Add to navigation items
{ label: 'New Page', path: '/new-page' }
```

### 4. Create API Service (if needed)

Add to `frontend/src/services/api/`:

```typescript
import api from '../../utils/api';

export interface Resource {
  id: string;
  name: string;
  // ... fields
}

export const resourceApi = {
  getAll: async (): Promise<Resource[]> => {
    const response = await api.get('/api/v1/resource');
    return response.data;
  },

  getById: async (id: string): Promise<Resource> => {
    const response = await api.get(`/api/v1/resource/${id}`);
    return response.data;
  },

  create: async (data: Partial<Resource>): Promise<Resource> => {
    const response = await api.post('/api/v1/resource', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Resource>): Promise<Resource> => {
    const response = await api.put(`/api/v1/resource/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/resource/${id}`);
  },
};
```

### 5. Add Zustand Store (if complex state needed)

Create `frontend/src/stores/resourceStore.ts`:

```typescript
import { create } from 'zustand';

interface ResourceState {
  selectedId: string | null;
  filter: string;
  setSelectedId: (id: string | null) => void;
  setFilter: (filter: string) => void;
}

export const useResourceStore = create<ResourceState>((set) => ({
  selectedId: null,
  filter: '',
  setSelectedId: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
}));
```

## Project Patterns

### Styling
- Use MUI `sx` prop for inline styles
- Use theme via `useTheme()` when needed
- Container with `maxWidth="lg"` for main content
- Paper component for card-like sections

### Data Fetching
- TanStack Query for server state
- Query keys as arrays: `['resource', id]`
- Mutations with `invalidateQueries` for cache updates

### Authentication
- Wrap page in `<ProtectedRoute>` in App.tsx
- Access auth state via `useAuthStore()`
- API calls auto-include JWT via axios interceptor in `utils/api.ts`

### Loading/Error States
- CircularProgress for loading
- Alert component for errors
- Skeleton components for partial loading

## Output

1. Create the page component
2. Update App.tsx with route
3. Update AppBar with navigation link
4. Create API service file if needed
5. Provide preview of what the page should look like
