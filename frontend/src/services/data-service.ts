/**
 * Data service that switches between mock and Snowflake based on environment.
 */

import { isSnowflakeEnabled, shouldUseMockData } from '../config/environments';
import { getSourceData, getEnrichmentResults, mockEnrichmentApi } from './mock-data';

export interface SourceRecord {
  id: number;
  external_id: string;
  applicant_name: string;
  loan_amount: number;
  property_state: string;
  status: string;
  created_at: string;
}

export interface EnrichmentResult {
  source_id: number;
  credit_score: number;
  dti_ratio: number;
  property_value: number;
  ltv_ratio: number;
  risk_category: string;
  enriched_at: string;
}

export async function fetchSourceData(): Promise<SourceRecord[]> {
  if (shouldUseMockData()) {
    console.log('[DataService] Using mock source data');
    return getSourceData();
  }

  if (!isSnowflakeEnabled()) {
    throw new Error('Snowflake is not enabled in this environment');
  }

  // TODO: Implement Snowflake query
  throw new Error('Snowflake integration not yet implemented');
}

export async function fetchEnrichmentResults(): Promise<EnrichmentResult[]> {
  if (shouldUseMockData()) {
    console.log('[DataService] Using mock enrichment data');
    return getEnrichmentResults();
  }

  if (!isSnowflakeEnabled()) {
    throw new Error('Snowflake is not enabled in this environment');
  }

  // TODO: Implement Snowflake query
  throw new Error('Snowflake integration not yet implemented');
}

export async function enrichRecords(sourceIds: number[]): Promise<EnrichmentResult[]> {
  if (shouldUseMockData()) {
    console.log('[DataService] Using mock enrichment API');
    return mockEnrichmentApi(sourceIds);
  }

  // TODO: Call real enrichment API
  throw new Error('Real API integration not yet implemented');
}
