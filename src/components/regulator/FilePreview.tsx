import {useEffect, useState} from "react";
import {reportsAPI} from "@/utils/API.ts";
import * as ExcelJS from "exceljs";
import {FileText} from "lucide-react";

// Function to format currency values with comma separators
const formatCurrencyValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    
    // Convert to string and check if it's a number
    const stringValue = String(value).trim();
    
    // Remove any existing formatting and check if it's a valid number
    const cleanValue = stringValue.replace(/[,\sMWK]/g, '');
    const numericValue = parseFloat(cleanValue);
    
    // If it's not a valid number, return as-is
    if (isNaN(numericValue)) return stringValue;
    
    // Format with comma separators
    return new Intl.NumberFormat('en-MW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericValue);
};

export function FilePreview({
                                reportId,
                                fileName,
                            }: {
    reportId: number;
    fileName: string;
}) {
    const [rows, setRows] = useState<any[][] | null>(null);
    const [loading, setLoading] = useState(false);

    const extension = fileName.split('.').pop()?.toLowerCase();

    useEffect(() => {
        if (!['xlsx', 'xls', 'csv'].includes(extension ?? '')) return;

        const loadExcel = async () => {
            try {
                setLoading(true);

                // USE API FUNCTION — NOT fetch(fileUrl)
                const blob = await reportsAPI.getRegulatorSubmitFile(reportId);

                const buffer = await blob.arrayBuffer();
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);

                const worksheet = workbook.getWorksheet(1);
                if (!worksheet) {
                    setRows(null);
                    return;
                }

                const data: any[][] = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber <= 30) { // Limit to first 30 rows
                        const values = row.values as any[];
                        // ExcelJS includes an empty element at index 0, so we filter it out
                        data.push(values.filter((_, index) => index > 0));
                    }
                });

                setRows(data);
            } catch (err) {
                console.error('Failed to parse Excel:', err);
                setRows(null);
            } finally {
                setLoading(false);
            }
        };

        loadExcel();
    }, [reportId, extension]);

    return (
        <div className="mt-4 rounded-xl border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100/20 dark:bg-indigo-900/30 flex items-center justify-center">
                        <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[260px]">
                            {fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {extension?.toUpperCase()} document
                        </p>
                    </div>
                </div>

            </div>

            {loading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    Loading preview…
                </div>
            ) : rows && rows.length > 0 ? (
                <div className="border rounded-lg overflow-auto max-h-[260px] bg-white dark:bg-slate-800">
                    <table className="min-w-full text-sm border-collapse">
                        <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                                {row.map((cell, j) => (
                                    <td
                                        key={j}
                                        className="px-3 py-2 border-r last:border-r-0 whitespace-nowrap text-gray-700 dark:text-gray-200"
                                    >
                                        {cell === null || cell === undefined ? '' : 
                                         typeof cell === 'object' && cell !== null ? 
                                         (cell.result !== undefined ? formatCurrencyValue(cell.result) : JSON.stringify(cell)) : 
                                         formatCurrencyValue(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No previewable data
                </div>
            )}
        </div>
    );
}