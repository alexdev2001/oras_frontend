import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Regulator {
    regulator_id: number;
    regulator_name: string;
}

interface Props {
    open: boolean;
    regulators: Regulator[];
    decodedRegulatorId: number | null;
    onConfirm: (regulatorName: string, months: number) => void;
    onClose: () => void;
}

export function PredictionPeriodDialog({
                                           open,
                                           regulators,
                                           decodedRegulatorId,
                                           onConfirm,
                                           onClose,
                                       }: Props) {
    const preselectedRegulator =
        decodedRegulatorId
            ? regulators.find(r => r.regulator_id === decodedRegulatorId)?.regulator_name ?? ""
            : "";

    const [selectedRegulator, setSelectedRegulator] = useState(preselectedRegulator);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Forecast Parameters</DialogTitle>
                </DialogHeader>

                {/* Regulator selection */}
                {decodedRegulatorId ? (
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Regulator</p>
                        <p className="text-lg font-semibold">{preselectedRegulator}</p>
                    </div>
                ) : (
                    <Select value={selectedRegulator} onValueChange={setSelectedRegulator}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select regulator" />
                        </SelectTrigger>
                        <SelectContent>
                            {regulators.map(r => (
                                <SelectItem key={r.regulator_id} value={r.regulator_name}>
                                    {r.regulator_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Period buttons */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {[3, 6, 12].map(months => (
                        <Button
                            key={months}
                            variant="outline"
                            disabled={!preselectedRegulator && !selectedRegulator}
                            onClick={() => {
                                onConfirm(
                                    decodedRegulatorId ? preselectedRegulator : selectedRegulator,
                                    months
                                );
                                onClose();
                            }}
                        >
                            {months} Months
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}