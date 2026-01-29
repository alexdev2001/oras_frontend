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
    Calendar,
    Radio,
    Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportInstructionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGetStarted?: () => void;
}

const TOTAL_STEPS = 6;

export function ReportInstructionsDialog({
                                             open,
                                             onOpenChange,
                                             onGetStarted,
                                         }: ReportInstructionsDialogProps) {
    const [step, setStep] = useState(0);

    const closeAndReset = () => {
        setStep(0);
        onOpenChange(false);
    };

    const handleContinue = () => {
        setStep(0);
        onOpenChange(false);
        onGetStarted?.();
    };

    return (
        <Dialog open={open} onOpenChange={closeAndReset}>
            <DialogContent className="max-w-2xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileSpreadsheet className="size-5 text-indigo-600" />
                        IGJ Regulatory Report Submission
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
                        {/* STEP 1 — MONTH SELECTION */}
                        {step === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Calendar className="text-blue-600" />
                                    Select Report Month
                                </h3>
                                
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
                                >
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                                        <span className="text-blue-600 font-bold">CAL</span> When submitting your report, you'll need to select:
                                    </p>
                                    
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm"
                                    >
                                        <Calendar className="size-5 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-sm">Month Picker</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Choose the exact month your report covers
                                            </p>
                                        </div>
                                    </motion.div>
                                    
                                    <motion.div
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800"
                                    >
                                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                                            <span className="text-yellow-600 font-bold">!</span> Important: One month per file only!
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            Each report file must contain data for a single reporting month
                                        </p>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* STEP 2 — ONLINE/OFFLINE SELECTION */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Radio className="text-green-600" />
                                    Choose Report Type
                                </h3>
                                
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
                                >
                                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-4">
                                        <span className="text-green-600 font-bold">SEL</span> Select your report type using radio buttons:
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-md border-2 border-green-500 shadow-sm"
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.4, type: "spring" }}
                                                className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </motion.div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">WEB Online</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    For online betting and gaming activities
                                                </p>
                                            </div>
                                        </motion.div>
                                        
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600"
                                        >
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">STR Offline</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    For physical betting shops and retail activities
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* STEP 3 — FILE RULES */}
                        {step === 2 && (
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

                        {/* STEP 4 — REQUIRED FIELDS */}
                        {step === 3 && (
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
                                            className="border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                        >
                                            {field}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 5 — DATA QUALITY */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-amber-600" />
                                    Data Quality Rules
                                </h3>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li>• Currency must be consistent for IGJ reporting</li>
                                    <li>• GGR = Stake − Payout</li>
                                    <li>• IGJ 4% and FUDOGO 6% levies calculated from GGR</li>
                                    <li>• No empty required fields</li>
                                    <li>• Operator names must be IGJ-licensed</li>
                                </ul>
                            </div>
                        )}

                        {/* STEP 6 — EXAMPLE */}
                        {step === 5 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                            >
                                <h3 className="font-semibold text-lg text-gray-900">
                                    IGJ Report Example Layout
                                </h3>

                                {/* ⬇️ Horizontal scroll ONLY here */}
                                <div className="relative">
                                    <div className="overflow-x-auto overscroll-x-contain rounded-lg border bg-gray-50 dark:bg-gray-800">
                                        <div className="min-w-[900px]">
                                            {/* Header */}
                                            <div className="grid grid-cols-10 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2">
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
                                                    className="grid grid-cols-10 px-3 py-2 text-xs border-t bg-white dark:bg-gray-900"
                                                >
                                                    <div className="text-gray-500 dark:text-gray-400">{row.no}</div>

                                                    <div className="col-span-2 font-medium text-gray-800 dark:text-gray-200 truncate">
                                                        {row.operator}
                                                    </div>

                                                    <div className="text-right tabular-nums">{row.stake}</div>
                                                    <div className="text-right tabular-nums">{row.payout}</div>
                                                    <div className="text-right tabular-nums">{row.cancelled}</div>
                                                    <div className="text-right tabular-nums">{row.open}</div>

                                                    <div className="text-right tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                                                        {row.ggr}
                                                    </div>

                                                    <div className="text-right tabular-nums text-green-700 dark:text-green-400">
                                                        {row.igj}
                                                    </div>

                                                    <div className="text-right tabular-nums text-blue-700 dark:text-blue-400">
                                                        {row.fudogo}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    • One operator per row for IGJ reporting
                                    • One reporting month per IGJ file
                                    • GGR = Stake − Payout
                                    • IGJ 4% and FUDOGO 6% levies calculated from GGR
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
                        <Button onClick={handleContinue}>
                            I Understand — Continue
                            <ArrowRight className="size-4 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
