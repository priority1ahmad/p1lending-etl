import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Box } from '@mui/material';
import { PlayArrow, Download, Delete, Settings } from '@mui/icons-material';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'link'],
      description: 'Button style variant',
    },
    colorScheme: {
      control: 'select',
      options: ['primary', 'accent', 'success', 'warning', 'error'],
      description: 'Color scheme',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Solid variants
export const SolidPrimary: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'primary',
    children: 'Primary Button',
  },
};

export const SolidAccent: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    children: 'Accent Button',
  },
};

export const SolidSuccess: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'success',
    children: 'Success Button',
  },
};

export const SolidWarning: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'warning',
    children: 'Warning Button',
  },
};

export const SolidError: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'error',
    children: 'Delete',
  },
};

// Outline variants
export const OutlinePrimary: Story = {
  args: {
    variant: 'outline',
    colorScheme: 'primary',
    children: 'Outline Button',
  },
};

export const OutlineAccent: Story = {
  args: {
    variant: 'outline',
    colorScheme: 'accent',
    children: 'Outline Accent',
  },
};

// Ghost variants
export const GhostPrimary: Story = {
  args: {
    variant: 'ghost',
    colorScheme: 'primary',
    children: 'Ghost Button',
  },
};

export const GhostAccent: Story = {
  args: {
    variant: 'ghost',
    colorScheme: 'accent',
    children: 'Ghost Accent',
  },
};

// Link variant
export const Link: Story = {
  args: {
    variant: 'link',
    colorScheme: 'accent',
    children: 'Link Button',
  },
};

// With icons
export const WithStartIcon: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    startIcon: <PlayArrow />,
    children: 'Start Job',
  },
};

export const WithIconOnly: Story = {
  args: {
    variant: 'ghost',
    colorScheme: 'primary',
    startIcon: <Settings />,
    children: '',
  },
};

// Loading states
export const Loading: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    loading: true,
    children: 'Save',
  },
};

export const LoadingWithText: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    loading: true,
    loadingText: 'Processing...',
    children: 'Start ETL',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

// Size variations
export const Small: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    size: 'small',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    size: 'large',
    children: 'Large Button',
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    variant: 'solid',
    colorScheme: 'accent',
    fullWidth: true,
    children: 'Full Width Button',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Solid Buttons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="solid" colorScheme="primary">
            Primary
          </Button>
          <Button variant="solid" colorScheme="accent">
            Accent
          </Button>
          <Button variant="solid" colorScheme="success">
            Success
          </Button>
          <Button variant="solid" colorScheme="warning">
            Warning
          </Button>
          <Button variant="solid" colorScheme="error">
            Error
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Outline Buttons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outline" colorScheme="primary">
            Primary
          </Button>
          <Button variant="outline" colorScheme="accent">
            Accent
          </Button>
          <Button variant="outline" colorScheme="success">
            Success
          </Button>
          <Button variant="outline" colorScheme="warning">
            Warning
          </Button>
          <Button variant="outline" colorScheme="error">
            Error
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Ghost Buttons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="ghost" colorScheme="primary">
            Primary
          </Button>
          <Button variant="ghost" colorScheme="accent">
            Accent
          </Button>
          <Button variant="ghost" colorScheme="success">
            Success
          </Button>
          <Button variant="ghost" colorScheme="warning">
            Warning
          </Button>
          <Button variant="ghost" colorScheme="error">
            Error
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Link Buttons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="link" colorScheme="primary">
            Primary Link
          </Button>
          <Button variant="link" colorScheme="accent">
            Accent Link
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          With Icons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="solid" colorScheme="accent" startIcon={<PlayArrow />}>
            Start
          </Button>
          <Button variant="outline" colorScheme="primary" startIcon={<Download />}>
            Download
          </Button>
          <Button variant="ghost" colorScheme="error" startIcon={<Delete />}>
            Delete
          </Button>
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          States
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="solid" colorScheme="accent" loading>
            Loading
          </Button>
          <Button variant="solid" colorScheme="primary" disabled>
            Disabled
          </Button>
        </Box>
      </Box>
    </Box>
  ),
};

// Import Typography for AllVariants story
import { Typography } from '@mui/material';
