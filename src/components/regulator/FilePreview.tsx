import {useEffect, useState} from "react";
import {reportsAPI} from "@/utils/API.ts";
import * as XLSX from "xlsx";
import {FileText} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";

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

                // ✅ USE API FUNCTION — NOT fetch(fileUrl)
                const blob = await reportsAPI.getRegulatorSubmitFile(reportId);

                const buffer = await blob.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const data = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    blankrows: false,
                }) as any[][];

                setRows(data.slice(0, 30));
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
        <div className="mt-4 rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileText className="size-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[260px]">
                            {fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                            {extension?.toUpperCase()} document
                        </p>
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                        const blob = await reportsAPI.getRegulatorSubmitFile(reportId);
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }}
                >
                    Open
                </Button>
            </div>

            {loading ? (
                <div className="p-6 text-center text-gray-500">
                    Loading preview…
                </div>
            ) : rows && rows.length > 0 ? (
                <div className="border rounded-lg overflow-auto max-h-[260px] bg-white">
                    <table className="min-w-full text-sm border-collapse">
                        <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                                {row.map((cell, j) => (
                                    <td
                                        key={j}
                                        className="px-3 py-2 border-r last:border-r-0 whitespace-nowrap text-gray-700"
                                    >
                                        {cell ?? ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center text-gray-500">
                    No previewable data
                </div>
            )}
        </div>
    );
}