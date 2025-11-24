import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { analyticsAPI } from '@/utils/API.ts';
import type { DataQuality } from '@/types/report.ts';
import { AlertTriangle, CheckCircle, Calendar, FileWarning, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';

export function DataQualityMonitor() {
    const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDataQuality();
    }, []);

    const loadDataQuality = async () => {
        setIsLoading(true);
        try {
            const { dataQuality: quality } = await analyticsAPI.getDataQuality();
            setDataQuality(quality);
        } catch (error) {
            console.error('Failed to load data quality metrics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Analyzing data quality...</p>
            </div>
        );
    }

    if (!dataQuality) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertTriangle className="size-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Unable to load data quality metrics</p>
                </CardContent>
            </Card>
        );
    }

    const hasIssues = dataQuality.totalIssues > 0;

    return (
        <div className="space-y-6">
            {/* Overall Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Data Quality Overview</CardTitle>
                            <CardDescription>Monitor data integrity and completeness</CardDescription>
                        </div>
                        {hasIssues ? (
                            <Badge className="bg-red-500">
                                <AlertTriangle className="size-3 mr-1" />
                                {dataQuality.totalIssues} Issue{dataQuality.totalIssues !== 1 ? 's' : ''}
                            </Badge>
                        ) : (
                            <Badge className="bg-green-500">
                                <CheckCircle className="size-3 mr-1" />
                                All Clear
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {hasIssues ? (
                        <Alert className="border-yellow-200 bg-yellow-50">
                            <AlertTriangle className="size-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800">Data Quality Issues Detected</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                                {dataQuality.totalIssues} issue{dataQuality.totalIssues !== 1 ? 's' : ''} require{dataQuality.totalIssues === 1 ? 's' : ''} attention.
                                Review the details below and take appropriate action.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="size-4 text-green-600" />
                            <AlertTitle className="text-green-800">Excellent Data Quality</AlertTitle>
                            <AlertDescription className="text-green-700">
                                All submitted reports meet quality standards. No issues detected.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Issue Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Calendar className="size-4" />
                            Missing Months
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
              <span className={`text-3xl ${dataQuality.missingMonths.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dataQuality.missingMonths.length}
              </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <FileWarning className="size-4" />
                            Invalid Rows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
              <span className={`text-3xl ${dataQuality.invalidRows.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dataQuality.invalidRows.length}
              </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingDown className="size-4" />
                            Balance Issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
              <span className={`text-3xl ${dataQuality.balanceDiscrepancies.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dataQuality.balanceDiscrepancies.length}
              </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <AlertTriangle className="size-4" />
                            Total Issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
              <span className={`text-3xl ${dataQuality.totalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dataQuality.totalIssues}
              </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Missing Months Detail */}
            {dataQuality.missingMonths.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="size-5 text-red-600" />
                            Missing Monthly Reports
                        </CardTitle>
                        <CardDescription>
                            Operators with gaps in monthly reporting
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dataQuality.missingMonths.map((missing, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="size-4 text-red-600" />
                                        <div>
                                            <p className="font-medium">Operator ID: {missing.operatorId}</p>
                                            <p className="text-sm text-gray-600">Missing report for {missing.expected}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                        Missing
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Invalid Rows Detail */}
            {dataQuality.invalidRows.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileWarning className="size-5 text-red-600" />
                            Invalid Data Entries
                        </CardTitle>
                        <CardDescription>
                            Reports with data validation errors
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dataQuality.invalidRows.map((invalid, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileWarning className="size-4 text-red-600" />
                                        <div>
                                            <p className="font-medium">Report: {invalid.reportId}</p>
                                            <p className="text-sm text-gray-600">{invalid.issue}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                        Invalid
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Balance Discrepancies Detail */}
            {dataQuality.balanceDiscrepancies.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="size-5 text-yellow-600" />
                            Balance Discrepancies
                        </CardTitle>
                        <CardDescription>
                            Reports with opening/closing balance inconsistencies
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {dataQuality.balanceDiscrepancies.map((discrepancy, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="size-4 text-yellow-600" />
                                            <p className="font-medium">Report: {discrepancy.reportId}</p>
                                        </div>
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                            Warning
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Opening Balance</p>
                                            <p className="font-medium">${discrepancy.openingBalance.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Closing Balance</p>
                                            <p className="font-medium">${discrepancy.closingBalance.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Expected Closing</p>
                                            <p className="font-medium">${discrepancy.expectedClosingBalance.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Difference</p>
                                            <p className="font-medium text-red-600">${discrepancy.difference.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                                        <p>
                                            <strong>Note:</strong> The closing balance differs from the expected value
                                            (opening balance + GGR). This may indicate missing transactions or data entry errors.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {hasIssues && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                        <CardDescription>Steps to improve data quality</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {dataQuality.missingMonths.length > 0 && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="size-4 text-indigo-600 mt-0.5" />
                                    <span className="text-sm">
                    Contact operators with missing reports to ensure timely submission
                  </span>
                                </li>
                            )}
                            {dataQuality.invalidRows.length > 0 && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="size-4 text-indigo-600 mt-0.5" />
                                    <span className="text-sm">
                    Review and reject reports with invalid data, requesting corrections from operators
                  </span>
                                </li>
                            )}
                            {dataQuality.balanceDiscrepancies.length > 0 && (
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="size-4 text-indigo-600 mt-0.5" />
                                    <span className="text-sm">
                    Investigate balance discrepancies with operators to identify missing transactions
                  </span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <CheckCircle className="size-4 text-indigo-600 mt-0.5" />
                                <span className="text-sm">
                  Implement automated validation rules to catch issues before approval
                </span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}