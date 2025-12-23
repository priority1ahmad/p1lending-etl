/**
 * Data service for fetching data from backend API.
 * Mock data has been removed - use Storybook for development testing.
 */

import { isSnowflakeEnabled } from '../config/environments';

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
  if (!isSnowflakeEnabled()) {
    throw new Error('Snowflake is not enabled in this environment');
  }

  // TODO: Implement Snowflake query via backend API
  throw new Error('Snowflake integration not yet implemented');
}

export async function fetchEnrichmentResults(): Promise<EnrichmentResult[]> {
  if (!isSnowflakeEnabled()) {
    throw new Error('Snowflake is not enabled in this environment');
  }

  // TODO: Implement Snowflake query via backend API
  throw new Error('Snowflake integration not yet implemented');
}

export async function enrichRecords(sourceIds: number[]): Promise<EnrichmentResult[]> {
  // TODO: Call real enrichment API via backend
  console.log('enrichRecords called with:', sourceIds);
  throw new Error('Real API integration not yet implemented');
}
