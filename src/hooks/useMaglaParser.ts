import { useState, useCallback } from 'react';
import { reportsAPI } from '@/utils/API';
import { parseMaglaFiles, extractMetricsFromParsedData } from '@/utils/maglaParser';
import type { MaglaFileData } from '@/utils/maglaParser';

export interface ParsedMaglaResult {
  operator_id: number;
  filename: string;
  parsedData: any[][];
  metrics?: any[];
  error?: string;
}

export function useMaglaParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ParsedMaglaResult[]>([]);

  const parseMaglaFilesFromAPI = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch file buffers from API
      const maglaFiles: MaglaFileData[] = await reportsAPI.getFileBuffers();
      
      if (!maglaFiles || maglaFiles.length === 0) {
        setError('No magla files found');
        return;
      }

      // Parse all files
      const parsedResults = await parseMaglaFiles(maglaFiles);
      
      // Extract metrics from parsed data
      const resultsWithMetrics = parsedResults.map(result => {
        const metrics = extractMetricsFromParsedData(result.parsedData);
        return {
          ...result,
          metrics: metrics || []
        };
      });

      setResults(resultsWithMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse magla files';
      setError(errorMessage);
      console.error('Error parsing magla files:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const parseSingleMaglaFile = useCallback(async (maglaFile: MaglaFileData) => {
    try {
      const parsedResult = await parseMaglaFiles([maglaFile]);
      const result = parsedResult[0];
      
      if (result.error) {
        throw new Error(result.error);
      }

      const metrics = extractMetricsFromParsedData(result.parsedData);
      
      return {
        ...result,
        metrics: metrics || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse magla file';
      console.error('Error parsing single magla file:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const downloadMaglaFile = useCallback(async (operatorId: number = 1): Promise<Blob> => {
    try {
      const blob = await reportsAPI.downloadMaglaFile(operatorId);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download MAGLA file';
      console.error('Error downloading MAGLA file:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const downloadAndParseMaglaFile = useCallback(async (operatorId: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Download the MAGLA file
      const blob = await downloadMaglaFile(operatorId);
      
      // Convert blob to base64 for parsing
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data URL prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Create MaglaFileData object
      const maglaFile: MaglaFileData = {
        operator_id: operatorId,
        filename: `magla_operator_${operatorId}.xlsx`,
        file_buffer: base64Data
      };

      // Parse the file
      const parsedResult = await parseSingleMaglaFile(maglaFile);
      
      // Update results
      setResults(prev => {
        const filtered = prev.filter(r => r.operator_id !== operatorId);
        return [...filtered, parsedResult];
      });

      return parsedResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download and parse MAGLA file';
      setError(errorMessage);
      console.error('Error downloading and parsing MAGLA file:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [downloadMaglaFile, parseSingleMaglaFile]);

  return {
    isLoading,
    error,
    results,
    parseMaglaFilesFromAPI,
    parseSingleMaglaFile,
    downloadMaglaFile,
    downloadAndParseMaglaFile,
    clearResults
  };
}
