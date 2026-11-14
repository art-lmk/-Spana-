/**
 * Robust CSV / TSV State Machine Parser
 * Handles quotes, commas inside quotes, escaped double quotes (""),
 * tab-separated values (TSV), semicolon delimiters, and multiline cells.
 */
export function parseCsvString(text: string): {
  headers: string[];
  rows: (string | number)[][];
} {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter from first non-empty line
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const firstLine = lines[0] || '';
  
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const parsedRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore carriage return
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          parsedRows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Flush remaining row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      parsedRows.push(currentRow);
    }
  }

  if (parsedRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Extract and clean headers
  const rawHeaders = parsedRows[0];
  const headers = rawHeaders.map((h, idx) => {
    const clean = h.replace(/^["']|["']$/g, '').trim();
    return clean || `Column_${idx + 1}`;
  });

  // Process rows
  const rows = parsedRows.slice(1).map(row => {
    return row.map(cell => {
      const clean = cell.replace(/^["']|["']$/g, '').trim();
      // If purely numeric, cast to number
      if (/^-?\d+(\.\d+)?$/.test(clean)) {
        const num = parseFloat(clean);
        return isNaN(num) ? clean : num;
      }
      return clean;
    });
  });

  return { headers, rows };
}
