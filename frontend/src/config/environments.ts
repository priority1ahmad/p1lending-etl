export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  snowflake: {
    enabled: boolean;
    account: string;
    database: string;
    warehouse: string;
    schema: string;
  };
  api: {
    enrichmentBaseUrl: string;
    useMockApi: boolean;
    timeout: number;
  };
  features: {
    enableDebugLogging: boolean;
    enablePerformanceMonitoring: boolean;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    snowflake: {
      enabled: false,  // No Snowflake in dev
      account: '',
      database: '',
      warehouse: '',
      schema: '',
    },
    api: {
      enrichmentBaseUrl: '',
      useMockApi: true,  // Always use mock in dev
      timeout: 30000,
    },
    features: {
      enableDebugLogging: true,
      enablePerformanceMonitoring: false,
    },
  },
  staging: {
    name: 'staging',
    snowflake: {
      enabled: true,
      account: import.meta.env.VITE_SNOWFLAKE_ACCOUNT || 'CL36377',
      database: import.meta.env.VITE_SNOWFLAKE_DATABASE || '',
      warehouse: import.meta.env.VITE_SNOWFLAKE_WAREHOUSE || '',
      schema: import.meta.env.VITE_SNOWFLAKE_SCHEMA || 'PUBLIC',
    },
    api: {
      enrichmentBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
      useMockApi: false,
      timeout: 30000,
    },
    features: {
      enableDebugLogging: true,
      enablePerformanceMonitoring: true,
    },
  },
  production: {
    name: 'production',
    snowflake: {
      enabled: true,
      account: import.meta.env.VITE_SNOWFLAKE_ACCOUNT || 'CL36377',
      database: import.meta.env.VITE_SNOWFLAKE_DATABASE || '',
      warehouse: import.meta.env.VITE_SNOWFLAKE_WAREHOUSE || '',
      schema: import.meta.env.VITE_SNOWFLAKE_SCHEMA || 'PUBLIC',
    },
    api: {
      enrichmentBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
      useMockApi: false,
      timeout: 15000,
    },
    features: {
      enableDebugLogging: false,
      enablePerformanceMonitoring: true,
    },
  },
};

export function getConfig(): EnvironmentConfig {
  const env = (import.meta.env.VITE_APP_ENV || 'development') as Environment;
  return configs[env];
}

export function getCurrentEnvironment(): Environment {
  return (import.meta.env.VITE_APP_ENV || 'development') as Environment;
}

export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

export function shouldUseMockData(): boolean {
  return getConfig().api.useMockApi;
}

export function isSnowflakeEnabled(): boolean {
  return getConfig().snowflake.enabled;
}
