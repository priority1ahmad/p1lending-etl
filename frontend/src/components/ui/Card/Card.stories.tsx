import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Box, Typography } from '@mui/material';
import { Button } from '../Button/Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'ghost'],
      description: 'Card style variant',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Padding size',
    },
    hoverable: {
      control: 'boolean',
      description: 'Enable hover effect',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <Box>
        <Typography variant="body1">
          This is a default card with a subtle border. Perfect for most use cases.
        </Typography>
      </Box>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    title: 'Card Title',
    subtitle: 'This is a subtitle',
    children: (
      <Box>
        <Typography variant="body2">
          Cards with titles automatically get a header section with a divider.
        </Typography>
      </Box>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'md',
    title: 'Elevated Card',
    children: (
      <Box>
        <Typography variant="body2">
          This card has a shadow instead of a border. Use for important content.
        </Typography>
      </Box>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    padding: 'md',
    title: 'Ghost Card',
    children: (
      <Box>
        <Typography variant="body2">
          Transparent card with no border or shadow. Minimal visual weight.
        </Typography>
      </Box>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    hoverable: true,
    title: 'Clickable Card',
    children: (
      <Box>
        <Typography variant="body2">
          Hover over this card to see the hover effect. Great for clickable cards.
        </Typography>
      </Box>
    ),
  },
};

export const WithActions: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    title: 'Settings',
    subtitle: 'Manage your preferences',
    children: (
      <Box>
        <Typography variant="body2">
          Cards can have action buttons in the footer.
        </Typography>
      </Box>
    ),
    actions: (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="ghost" colorScheme="primary" size="small">
          Cancel
        </Button>
        <Button variant="solid" colorScheme="accent" size="small">
          Save
        </Button>
      </Box>
    ),
  },
};

export const WithHeaderAction: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    title: 'ETL Job Status',
    subtitle: 'Last updated 2 minutes ago',
    headerAction: (
      <Button variant="ghost" colorScheme="accent" size="small">
        Refresh
      </Button>
    ),
    children: (
      <Box>
        <Typography variant="body2">Status: Running</Typography>
        <Typography variant="body2">Progress: 45%</Typography>
      </Box>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    title: 'Table Container',
    children: (
      <Box sx={{ p: 0 }}>
        <Typography variant="body2" sx={{ p: 2 }}>
          Use padding="none" for custom layouts or when wrapping components like tables.
        </Typography>
      </Box>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    title: 'Welcome',
    subtitle: 'Get started with your ETL workflow',
    children: (
      <Box>
        <Typography variant="body1" gutterBottom>
          Large padding creates more breathing room for important content.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Perfect for welcome screens, onboarding, or featured content.
        </Typography>
      </Box>
    ),
  },
};
