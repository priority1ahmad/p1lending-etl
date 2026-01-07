import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportButton } from './ImportButton';
import { Box, Typography } from '@mui/material';


const meta: Meta<typeof ImportButton> = {
  title: 'Features/Import/ImportButton',
  component: ImportButton,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    isImporting: {
      control: 'boolean',
      description: 'Import in progress',
    },
    isExporting: {
      control: 'boolean',
      description: 'Export in progress',
    },
    onImport: { action: 'import-clicked' },
    onExport: { action: 'export-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ImportButton>;

export const Default: Story = {
  args: {
    disabled: false,
    isImporting: false,
    isExporting: false,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Importing: Story = {
  args: {
    isImporting: true,
  },
};

export const Exporting: Story = {
  args: {
    isExporting: true,
  },
};

export const InToolbar: Story = {
  render: (args) => (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6">Results Table Toolbar</Typography>
      <ImportButton {...args} />
    </Box>
  ),
  args: {
    disabled: false,
  },
};
