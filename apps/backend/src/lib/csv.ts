import { stringify } from 'csv-stringify/sync';

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Formula injection prevention
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str.charAt(0))) {
    return `'${str}`;
  }
  return str;
}

export function formatCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const sanitizedRows = rows.map((row) => {
    const sanitized: Record<string, string> = {};
    for (const col of columns) {
      sanitized[col] = sanitizeCsvCell(row[col]);
    }
    return sanitized;
  });

  return stringify(sanitizedRows, {
    header: true,
    columns: columns.map((col) => ({ key: col, header: col })),
  });
}

