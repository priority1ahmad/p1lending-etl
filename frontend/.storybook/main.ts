import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: ['@storybook/addon-links', '@storybook/addon-mcp', '@storybook/addon-docs'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  staticDirs: ['../public'],

  core: {
    disableTelemetry: true,
  },

  // Required for remote access on Linode
  async viteFinal(config) {
    return {
      ...config,
      server: {
        ...config.server,
        host: '0.0.0.0',
      },
    };
  }
};

export default config;
