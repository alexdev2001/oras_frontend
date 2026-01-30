"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMaglaParser } from '@/hooks/useMaglaParser';
import { FileText, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function MaglaFileParser() {
  const { 
    isLoading, 
    error, 
    results, 
    parseMaglaFilesFromAPI, 
    clearResults 
  } = useMaglaParser();

  const handleParseFiles = async () => {
    await parseMaglaFilesFromAPI();
  };

  const handleClearResults = () => {
    clearResults();
  };

  const downloadParsedData = (result: any) => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.filename}_parsed.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Magla File Parser
            <Badge variant="secondary">Excel Files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleParseFiles} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Parsing Files...
                </>
              ) : (
                <>
                  <FileText className="size-4" />
                  Parse Magla Files
                </>
              )}
            </Button>
            
            {results.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearResults}
                className="flex items-center gap-2"
              >
                Clear Results
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Parsing magla files...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              Parsed Results
              <Badge variant="secondary">{results.length} files</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4" />
                      <span className="font-medium">{result.filename}</span>
                      <Badge variant="outline">Operator {result.operator_id}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <>
                          <Badge variant="secondary">
                            {result.parsedData.length} rows
                          </Badge>
                          {result.metrics && (
                            <Badge variant="secondary">
                              {result.metrics.length} metrics
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadParsedData(result)}
                            className="flex items-center gap-1"
                          >
                            <Download className="size-3" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {result.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}

                  {result.parsedData.length > 0 && !result.error && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Preview (first 5 rows):</p>
                      <div className="border rounded-md overflow-hidden">
                        <div className="max-h-40 overflow-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted">
                              <tr>
                                {result.parsedData[0]?.map((header: any, colIndex: number) => (
                                  <th key={colIndex} className="p-2 text-left border-b">
                                    {header || `Column ${colIndex + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.parsedData.slice(1, 6).map((row: any[], rowIndex) => (
                                <tr key={rowIndex} className="border-b">
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-2 border-r">
                                      {cell || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
