import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PredictionPeriodDialog({
                                           onConfirm,
                                       }: {
    onConfirm: (months: number) => void;
}) {
    const [open, setOpen] = useState(true);

    return (
        <Dialog open={open}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Forecast Period</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4">
                    {[3, 6, 12].map(m => (
                        <Button
                            key={m}
                            onClick={() => {
                                onConfirm(m);
                                setOpen(false);
                            }}
                            variant="outline"
                        >
                            {m} Months
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}