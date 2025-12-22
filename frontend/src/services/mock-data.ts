/**
 * Mock data service for development environment.
 * Loads data from JSON fixtures instead of Snowflake.
 */

import { isDevelopment } from '../config/environments';

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

// Import fixture data directly for Vite bundling
import sourceDataFixture from '../../../tests/fixtures/source_data.json';
import enrichmentResultsFixture from '../../../tests/fixtures/enrichment_results.json';

export function getSourceData(): SourceRecord[] {
  if (!isDevelopment()) {
    throw new Error('Mock data only available in development');
  }
  return sourceDataFixture as SourceRecord[];
}

export function getEnrichmentResults(): EnrichmentResult[] {
  if (!isDevelopment()) {
    throw new Error('Mock data only available in development');
  }
  return enrichmentResultsFixture as EnrichmentResult[];
}

export async function mockEnrichmentApi(
  sourceIds: number[]
): Promise<EnrichmentResult[]> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  const allResults = getEnrichmentResults();
  return allResults.filter((r) => sourceIds.includes(r.source_id));
}
