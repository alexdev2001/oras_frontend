import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
    FileSpreadsheet,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportInstructionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 4;

export function ReportInstructionsDialog({
                                             open,
                                             onOpenChange,
                                         }: ReportInstructionsDialogProps) {
    const [step, setStep] = useState(0);

    const closeAndReset = () => {
        setStep(0);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={closeAndReset}>
            <DialogContent className="max-w-2xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileSpreadsheet className="size-5 text-indigo-600" />
                        Regulatory Report Submission
                    </DialogTitle>
                    <DialogDescription>
                        Step {step + 1} of {TOTAL_STEPS}
                    </DialogDescription>
                </DialogHeader>

                {/* SLIDES */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="min-h-[320px] flex flex-col justify-center overflow-hidden"
                    >
                        {/* STEP 1 — FILE RULES */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <CheckCircle className="text-green-600" />
                                    File Requirements
                                </h3>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li>• Excel (.xlsx, .xls) or CSV (.csv)</li>
                                    <li>• One reporting month per file</li>
                                    <li>• Single sheet only</li>
                                    <li>• Maximum file size: 10MB</li>
                                </ul>
                            </div>
                        )}

                        {/* STEP 2 — REQUIRED FIELDS */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">
                                    Required Columns
                                </h3>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {[
                                        "Operators",
                                        "Stake / Take",
                                        "Payout",
                                        "Cancelled",
                                        "Open Tickets",
                                        "GGR",
                                        "IGJ 4%",
                                        "FUDOGO 6%",
                                    ].map((field) => (
                                        <div
                                            key={field}
                                            className="border rounded-md px-3 py-2 bg-gray-50"
                                        >
                                            {field}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 3 — DATA QUALITY */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-amber-600" />
                                    Data Quality Rules
                                </h3>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li>• Currency must be consistent</li>
                                    <li>• GGR = Stake − Payout</li>
                                    <li>• Levy calculated from GGR</li>
                                    <li>• No empty required fields</li>
                                    <li>• Operator names must be licensed</li>
                                </ul>
                            </div>
                        )}

                        {/* STEP 4 — EXAMPLE */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                            >
                                <h3 className="font-semibold text-lg text-gray-900">
                                    Example Spreadsheet Layout
                                </h3>

                                {/* ⬇️ Horizontal scroll ONLY here */}
                                <div className="relative">
                                    <div className="overflow-x-auto overscroll-x-contain rounded-lg border bg-gray-50">
                                        <div className="min-w-[900px]">
                                            {/* Header */}
                                            <div className="grid grid-cols-10 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-2">
                                                <div>No.</div>
                                                <div className="col-span-2">Operator</div>
                                                <div className="text-right">Stake</div>
                                                <div className="text-right">Payout</div>
                                                <div className="text-right">Cancelled</div>
                                                <div className="text-right">Open Tickets</div>
                                                <div className="text-right">GGR</div>
                                                <div className="text-right">IGJ 4%</div>
                                                <div className="text-right">FUDOGO 6%</div>
                                            </div>

                                            {/* Rows */}
                                            {[
                                                {
                                                    no: 1,
                                                    operator: "PRIMEIRA APOSTA (LOTO)",
                                                    stake: "148,238,850",
                                                    payout: "77,891,024",
                                                    cancelled: "10,000",
                                                    open: "50,000",
                                                    ggr: "70,347,826",
                                                    igj: "2,813,913",
                                                    fudogo: "4,220,870",
                                                },
                                                {
                                                    no: 2,
                                                    operator: "JOGABETS (Casino Polana)",
                                                    stake: "67,034,157.11",
                                                    payout: "54,747,989.48",
                                                    cancelled: "5,000",
                                                    open: "25,000",
                                                    ggr: "12,286,167.63",
                                                    igj: "491,447",
                                                    fudogo: "737,170",
                                                },
                                                {
                                                    no: 3,
                                                    operator: "HOLLYWOOD",
                                                    stake: "103,244,875.31",
                                                    payout: "81,449,796.97",
                                                    cancelled: "8,500",
                                                    open: "31,200",
                                                    ggr: "21,795,078.34",
                                                    igj: "871,803",
                                                    fudogo: "1,307,705",
                                                },
                                            ].map((row) => (
                                                <div
                                                    key={row.no}
                                                    className="grid grid-cols-10 px-3 py-2 text-xs border-t bg-white"
                                                >
                                                    <div className="text-gray-500">{row.no}</div>

                                                    <div className="col-span-2 font-medium text-gray-800 truncate">
                                                        {row.operator}
                                                    </div>

                                                    <div className="text-right tabular-nums">{row.stake}</div>
                                                    <div className="text-right tabular-nums">{row.payout}</div>
                                                    <div className="text-right tabular-nums">{row.cancelled}</div>
                                                    <div className="text-right tabular-nums">{row.open}</div>

                                                    <div className="text-right tabular-nums font-semibold text-indigo-600">
                                                        {row.ggr}
                                                    </div>

                                                    <div className="text-right tabular-nums text-green-700">
                                                        {row.igj}
                                                    </div>

                                                    <div className="text-right tabular-nums text-blue-700">
                                                        {row.fudogo}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 italic">
                                    • One operator per row
                                    • One reporting month per file
                                    • GGR = Stake − Payout
                                    • Levies calculated from GGR
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* FOOTER NAV */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        variant="outline"
                        disabled={step === 0}
                        onClick={() => setStep((s) => s - 1)}
                    >
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>

                    {step < TOTAL_STEPS - 1 ? (
                        <Button onClick={() => setStep((s) => s + 1)}>
                            Next
                            <ArrowRight className="size-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={closeAndReset}>
                            I Understand — Continue
                            <ArrowRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
