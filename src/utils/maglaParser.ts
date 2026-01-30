import * as XLSX from 'xlsx';

export interface MaglaFileData {
  operator_id: number;
  filename: string;
  file_buffer: string;
}

export interface ParsedMaglaData {
  operator_id: number;
  filename: string;
  parsedData: any[][];
  error?: string;
}

/**
 * Decodes base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parses a single magla file buffer
 */
export async function parseMaglaFile(maglaFile: MaglaFileData): Promise<ParsedMaglaData> {
  try {
    // Decode base64 buffer
    const arrayBuffer = base64ToArrayBuffer(maglaFile.file_buffer);
    
    // Create workbook from array buffer
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet (you might want to make this configurable)
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to JSON
    const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    return {
      operator_id: maglaFile.operator_id,
      filename: maglaFile.filename,
      parsedData
    };
  } catch (error) {
    console.error(`Error parsing magla file ${maglaFile.filename}:`, error);
    return {
      operator_id: maglaFile.operator_id,
      filename: maglaFile.filename,
      parsedData: [],
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Parses multiple magla files in batch
 */
export async function parseMaglaFiles(maglaFiles: MaglaFileData[]): Promise<ParsedMaglaData[]> {
  const results = await Promise.allSettled(
    maglaFiles.map(file => parseMaglaFile(file))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        operator_id: maglaFiles[index].operator_id,
        filename: maglaFiles[index].filename,
        parsedData: [],
        error: result.reason?.message || 'Failed to parse file'
      };
    }
  });
}

/**
 * Extracts structured data from parsed magla data
 * This is a helper function - you'll need to customize based on your Excel structure
 */
export function extractMetricsFromParsedData(parsedData: any[][]) {
  if (parsedData.length === 0) return null;
  
  // Skip header row and process data rows
  const dataRows = parsedData.slice(1);
  
  // This is a generic example - customize based on your Excel structure
  const metrics = dataRows.map(row => ({
    // Map columns based on your Excel structure
    // Example: assuming columns are [Date, Stake, Winnings, GGR, etc.]
    date: row[0],
    total_stake: parseFloat(row[1]) || 0,
    total_winnings: parseFloat(row[2]) || 0,
    ggr: parseFloat(row[3]) || 0,
    det_levy: parseFloat(row[4]) || 0,
    gaming_tax: parseFloat(row[5]) || 0,
    total_bet_count: parseInt(row[6]) || 0,
  })).filter(row => row.date && !isNaN(row.total_stake));
  
  return metrics;
}
