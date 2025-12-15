---
allowed-tools: Read, Edit, Write, Glob
description: Create a new React page component with MUI and routing
argument-hint: <page-name>
---

## Task
Create a new React page named `$1`.

## Workflow

### Step 1: Analyze Existing Patterns
Read reference implementations:
- `@frontend/src/pages/Dashboard.tsx` - Form handling, API calls
- `@frontend/src/pages/ETLResults.tsx` - Data tables, pagination
- `@frontend/src/pages/SqlEditor.tsx` - Editor component
- `@frontend/src/components/layout/Layout.tsx` - Layout wrapper

Key patterns:
- MUI components from theme
- TanStack Query for data fetching
- Zustand for auth state
- Protected route wrapper
- Error boundaries

### Step 2: Create Page Component
Create `frontend/src/pages/{PageName}.tsx`:

```tsx
/**
 * {PageName} Page
 *
 * Description of what this page does.
 */
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API imports
// import { getData, createData } from '@/services/api/{pageName}';

// Types
interface {PageName}Data {
  id: string;
  // ... fields
}

// Error Boundary Fallback
const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <Box sx={{ p: 3 }}>
    <Alert severity="error" sx={{ mb: 2 }}>
      Something went wrong: {error.message}
    </Alert>
    <Button variant="contained" onClick={resetError}>
      Try Again
    </Button>
  </Box>
);

// Loading Skeleton
const PageSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={400} />
  </Box>
);

export default function {PageName}() {
  // State
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Data fetching with TanStack Query
  const {
    data,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['{pageName}'],
    queryFn: async () => {
      // Replace with actual API call
      // return await getData();
      return [] as {PageName}Data[];
    },
  });

  // Mutation example
  const mutation = useMutation({
    mutationFn: async (newData: Partial<{PageName}Data>) => {
      // Replace with actual API call
      // return await createData(newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{pageName}'] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorFallback
        error={queryError as Error}
        resetError={() => refetch()}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {PageName}
        </Typography>
        <Button
          variant="contained"
          onClick={() => mutation.mutate({})}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <CircularProgress size={20} /> : 'Action'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Page content goes here
        </Typography>

        {/* Data display example */}
        {data && data.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {data.map((item) => (
              <Box key={item.id} sx={{ mb: 1 }}>
                {/* Render item */}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No data available
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
```

### Step 3: Add Route
Edit `frontend/src/App.tsx`:

```tsx
import {PageName} from '@/pages/{PageName}';

// Inside Routes, add:
<Route
  path="/{page-name}"
  element={
    <ProtectedRoute>
      <Layout>
        <{PageName} />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### Step 4: Add to Sidebar Navigation
Edit `frontend/src/components/layout/Sidebar.tsx`:

```tsx
// Add to navigation items
{
  text: '{Page Name}',
  path: '/{page-name}',
  icon: <IconComponent />, // Import appropriate MUI icon
}
```

### Step 5: Create API Service (if needed)
If page needs data:
```bash
/add-api-service {pageName}
```

## Component Patterns

### Form Handling
```tsx
const [formData, setFormData] = useState({ field: '' });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  mutation.mutate(formData);
};

<form onSubmit={handleSubmit}>
  <TextField
    value={formData.field}
    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
  />
  <Button type="submit">Submit</Button>
</form>
```

### Table with Pagination
```tsx
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', flex: 1 },
];

<DataGrid
  rows={data || []}
  columns={columns}
  pageSizeOptions={[10, 25, 50]}
  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
/>
```

### Modal/Dialog
```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleConfirm}>Confirm</Button>
  </DialogActions>
</Dialog>
```

## Output
- Created: `frontend/src/pages/{PageName}.tsx`
- Updated: `frontend/src/App.tsx` (route)
- Updated: `frontend/src/components/layout/Sidebar.tsx` (navigation)

## Error Handling
- If page already exists, warn before overwriting
- If App.tsx structure differs, provide manual instructions

## Related Commands
- For API service: `/add-api-service`
- For state store: `/add-zustand-store`
- For backend endpoint: `/add-endpoint`

## Example
```
/add-react-page UserSettings
```
Creates UserSettings page with routing and sidebar navigation.
