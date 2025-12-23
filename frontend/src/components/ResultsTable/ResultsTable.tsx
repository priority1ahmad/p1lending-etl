import React from 'react';

export interface ResultsTableProps {
  /** Data to display */
  data: Array<Record<string, unknown>>;
  /** Column definitions */
  columns: Array<{
    key: string;
    label: string;
    render?: (value: unknown) => React.ReactNode;
  }>;
  /** Is data loading? */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Empty state message */
  emptyMessage?: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  columns,
  isLoading = false,
  error,
  emptyMessage = 'No results found',
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        <p className="font-medium">Error loading results</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row[col.key]) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
