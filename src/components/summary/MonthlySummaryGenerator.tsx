import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { managementAPI, reportsAPI } from "@/utils/API";

interface Props {
    mode?: "operator" | "regulator";
}

export function MonthlySummaryGenerator({ mode = "operator" }: Props) {
    const isRegulator = mode === "regulator";

    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const months = [
        { value: "2025-01", label: "January 2025" },
        { value: "2025-02", label: "February 2025" },
        { value: "2025-03", label: "March 2025" },
        { value: "2025-04", label: "April 2025" },
        { value: "2025-05", label: "May 2025" },
        { value: "2025-06", label: "June 2025" },
        { value: "2025-07", label: "July 2025" },
        { value: "2025-08", label: "August 2025" },
        { value: "2025-09", label: "September 2025" },
        { value: "2025-10", label: "October 2025" },
        { value: "2025-11", label: "November 2025" },
        { value: "2025-12", label: "December 2025" },
    ];

    const handleGenerate = async () => {
        try {
            setLoading(true);

            if (isRegulator) {
                const blob = await reportsAPI.downloadRegulatorExcel();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "Regulator_Report_Latest_Year.xlsx";
                link.click();
                URL.revokeObjectURL(url);
            } else {
                if (!selectedMonth) return;

                const response = await managementAPI.generateMonthlySummary(selectedMonth);
                const hex = response.content.replace(/[^0-9a-f]/gi, "");
                const byteArray = new Uint8Array(
                    hex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
                );

                const blob = new Blob([byteArray], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = response.filename || "summary.pdf";
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch {
            alert(`Failed to generate ${isRegulator ? "Excel" : "PDF"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`
                mb-6 rounded-lg border bg-white p-4
                flex items-end gap-6
                ${isRegulator ? "border-blue-200" : "border-gray-200"}
            `}
        >
            {/* Control column */}
            <div className="flex flex-col w-64">
                <Label className="text-sm font-medium mb-1 text-gray-700">
                    {isRegulator
                        ? "Regulator: Annual Metrics (Excel)"
                        : "Operator: Monthly Summary (PDF)"}
                </Label>

                {/* Keep height consistent */}
                {isRegulator ? (
                    <div className="h-10 rounded-md border bg-gray-50 flex items-center px-3 text-sm text-gray-500">
                        Latest available year
                    </div>
                ) : (
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a month..." />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Action button */}
            <Button
                onClick={handleGenerate}
                disabled={loading || (!isRegulator && !selectedMonth)}
                className={`
                    h-10 px-6
                    ${isRegulator ? "bg-blue-600 hover:bg-blue-700" : ""}
                `}
            >
                {loading
                    ? "Processing..."
                    : `Generate ${isRegulator ? "Excel" : "Summary"}`}
            </Button>
        </div>
    );
}