import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import { managementAPI } from "@/utils/API.ts";

export function MonthlySummaryGenerator() {
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
        if (!selectedMonth) {
            alert("Please select a month first");
            return;
        }

        try {
            setLoading(true);

            // Call backend API
            const response = await managementAPI.generateMonthlySummary(selectedMonth);

            // ❗ Validate response before using it
            if (!response || !response.content) {
                throw new Error("Backend did not return PDF content");
            }

            // Convert hex string -> byte array
            const hex = response.content.replace(/[^0-9a-f]/gi, "");
            const byteArray = new Uint8Array(
                hex.match(/.{1,2}/g).map((b: string) => parseInt(b, 16))
            );

            // Build PDF Blob
            const blob = new Blob([byteArray], { type: "application/pdf" });

            // Trigger browser download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = response.filename || "summary.pdf";
            link.click();

            URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error("Failed to download summary PDF:", err);

            // If error response is HTML, show readable message
            if (err?.response?.data?.includes?.("<!doctype")) {
                alert("Backend returned HTML instead of JSON. Check endpoint or server error.");
            } else {
                alert("Failed to generate summary report");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6 bg-white border rounded-lg p-4 flex items-end gap-4">
            {/* Dropdown with label */}
            <div className="flex flex-col">
                <Label htmlFor="month-select" className="text-sm font-medium">Select Month:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month-select" className="w-48">
                        <SelectValue placeholder="Choose a month..." />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                                {month.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Inline button */}
            <Button
                onClick={handleGenerate}
                disabled={loading || !selectedMonth}
            >
                {loading ? "Generating..." : "Generate Summary"}
            </Button>
        </div>
    );
}