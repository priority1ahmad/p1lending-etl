/**
 * TypeScript interfaces for File Source feature
 */

export interface FileSource {
  id: string;
  name: string;
  description?: string;
  file_type: 'excel' | 'csv';
  original_filename: string;
  column_mapping: Record<string, string>;
  sample_data: Record<string, unknown>[];
  row_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface FileSourceCreate {
  name: string;
  description?: string;
  file_type: 'excel' | 'csv';
  original_filename: string;
  column_mapping: Record<string, string>;
  sample_data: Record<string, unknown>[];
  row_count: number;
}

export interface FileSourceUpdate {
  name?: string;
  description?: string;
  column_mapping?: Record<string, string>;
}

export interface FileUploadResponse {
  detected_columns: string[];
  sample_data: Record<string, unknown>[];
  row_count: number;
  file_type: 'excel' | 'csv';
  original_filename: string;
}

export interface ColumnMapping {
  source_column: string;
  target_column: string;
}

export interface MappingValidationError {
  field: string;
  message: string;
}

/**
 * Standard schema columns that can be mapped to
 */
export const STANDARD_SCHEMA_COLUMNS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP Code' },
  { value: 'loan_amount', label: 'Loan Amount' },
  { value: 'property_value', label: 'Property Value' },
  { value: 'credit_score', label: 'Credit Score' },
  { value: 'income', label: 'Income' },
  { value: 'employment_status', label: 'Employment Status' },
  { value: 'property_type', label: 'Property Type' },
  { value: 'loan_type', label: 'Loan Type' },
  { value: 'loan_purpose', label: 'Loan Purpose' },
  { value: 'ssn', label: 'SSN' },
  { value: 'dob', label: 'Date of Birth' },
  { value: 'custom', label: 'Custom Field (skip)' },
] as const;

export type StandardSchemaColumn = typeof STANDARD_SCHEMA_COLUMNS[number]['value'];
