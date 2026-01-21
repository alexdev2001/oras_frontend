import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { managementAPI, reportsAPI } from "@/utils/API";
import type {Regulator} from "@/types/regulator.ts";

interface Props {
    mode?: "operator" | "regulator";
}

const getLast12Months = () => {
    const months: { value: string; label: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        months.push({
            value: `${year}-${month}`,
            label: date.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
            }),
        });
    }

    return months;
};

export function MonthlySummaryGenerator({ mode = "operator" }: Props) {
    const isRegulator = mode === "regulator";

    // Generate months once
    const months = useMemo(() => getLast12Months(), []);

    // Auto-select current month for operator mode
    const [selectedMonth, setSelectedMonth] = useState<string>(
        ""
    );

    const [loading, setLoading] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [regulators, setRegulators] = useState<Regulator[]>([]);
    const [selectedRegulator, setSelectedRegulator] = useState<string>("");
    const [showAlert, setShowAlert] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (dialogOpen) {
            managementAPI.getRegulators().then(setRegulators);
        }
    }, [dialogOpen]);


    const handleGenerate = async () => {
        if (isRegulator) {
            setDialogOpen(true);
            return;
        }

        // -------- Operator flow (unchanged) --------
        try {
            if (!selectedMonth) return;

            setLoading(true);

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
        } catch (error) {
            console.error(error);
            setAlertTitle("PDF Generation Failed");
            setAlertMessage("Failed to generate PDF. Please try again.");
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRegulatorDownload = async () => {
        if (!selectedRegulator) return;

        try {
            setLoading(true);

            const regulatorId = Number(selectedRegulator);

            const regulator = regulators.find(
                r => r.regulator_id === regulatorId
            );

            const regulatorName = regulator?.regulator_name
                    ?.replace(/\s+/g, "_")
                    ?.replace(/[^a-zA-Z0-9_-]/g, "")
                || "Regulator";

            const blob = await reportsAPI.downloadRegulatorExcel(regulatorId);

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            link.download = `${regulatorName}_Report_Latest_Year.xlsx`;

            link.click();

            URL.revokeObjectURL(url);
            setDialogOpen(false);
        } catch (error) {
            console.error(error);
            setAlertTitle("Excel Download Failed");
            setAlertMessage("Failed to download Excel. Please try again.");
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* -------- Main Card -------- */}
            <div
                className={`
          mb-6 rounded-lg border bg-card p-4
          flex items-end gap-6
          ${isRegulator ? "border-purple-200 dark:border-purple-800" : "border-border"}
        `}
            >
                <div className="flex flex-col w-64">
                    <Label className="text-sm font-medium mb-1 text-foreground">
                        {isRegulator
                            ? "Regulator: Annual Metrics (Excel)"
                            : "Operator: Monthly Summary (PDF)"}
                    </Label>

                    {isRegulator ? (
                        <div className="h-10 rounded-md border bg-muted flex items-center px-3 text-sm text-muted-foreground">
                            Latest available year
                        </div>
                    ) : (
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full border-input focus:border-ring focus:ring-ring">
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

                <Button
                    onClick={handleGenerate}
                    disabled={loading || (!isRegulator && !selectedMonth)}
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700"
                >
                    {loading
                        ? "Processing..."
                        : `Generate ${isRegulator ? "Excel" : "Summary"}`}
                </Button>
            </div>

            {/* -------- Regulator Dialog -------- */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Download Regulator Report</DialogTitle>
                        <DialogDescription>
                            Select the regulator for which the annual Excel report should be
                            generated.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">Regulator</Label>
                            <Select
                                value={selectedRegulator}
                                onValueChange={setSelectedRegulator}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Choose regulator..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {regulators.map((r) => (
                                        <SelectItem
                                            key={r.regulator_id}
                                            value={String(r.regulator_id)}
                                        >
                                            {r.regulator_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRegulatorDownload}
                            disabled={!selectedRegulator || loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? "Generating..." : "Download Excel"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

