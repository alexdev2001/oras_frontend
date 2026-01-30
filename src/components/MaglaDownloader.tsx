import { useMaglaParser } from '@/hooks/useMaglaParser';

interface MaglaDownloaderProps {
  operatorId?: number;
  onDownloadComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function MaglaDownloader({ 
  operatorId = 1, 
  onDownloadComplete, 
  onError 
}: MaglaDownloaderProps) {
  const { 
    downloadMaglaFile, 
    downloadAndParseMaglaFile, 
    isLoading, 
    error 
  } = useMaglaParser();

  const handleDownloadOnly = async () => {
    try {
      const blob = await downloadMaglaFile(operatorId);
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `magla_operator_${operatorId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      onError?.(errorMessage);
    }
  };

  const handleDownloadAndParse = async () => {
    try {
      const result = await downloadAndParseMaglaFile(operatorId);
      onDownloadComplete?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download and parse failed';
      onError?.(errorMessage);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">MAGLA File Downloader</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="operatorId" className="text-sm font-medium">
            Operator ID:
          </label>
          <input
            id="operatorId"
            type="number"
            value={operatorId}
            onChange={() => {
              // Note: You'll need to handle operatorId state in parent component
              // This is just for display purposes
            }}
            className="border rounded px-2 py-1 w-20"
            readOnly
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleDownloadOnly}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Downloading...' : 'Download MAGLA File'}
          </button>
          
          <button
            onClick={handleDownloadAndParse}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Downloading & Parsing...' : 'Download & Parse MAGLA'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <div className="text-xs text-gray-600">
          <p>Download URL: http://localhost:8000/api/v1/reports/operator/{operatorId}/download</p>
        </div>
      </div>
    </div>
  );
}

export default MaglaDownloader;
