"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { PredictionPeriodDialog } from "./PredictionPeriodDialog";
import { OperatorPredictionCharts } from "./OperatorPredictionCharts";
import type { RegulatorAnalytics } from "@/components/admin/AdminRegulatorDataTables";
import { Button } from "@/components/ui/button";

interface Props {
    regulatorAnalytics: RegulatorAnalytics[];
    regulators: { regulator_id: number; regulator_name: string }[];
    decodedRegulatorId: number | null;
}

export function RegulatorPredictionsTab({
                                            regulatorAnalytics,
                                            regulators,
                                            decodedRegulatorId,
                                        }: Props) {
    const [period, setPeriod] = useState<number | null>(null);
    const [selectedRegulator, setSelectedRegulator] = useState<string | null>(
        decodedRegulatorId
            ? regulators.find(r => r.regulator_id === decodedRegulatorId)?.regulator_name ?? null
            : null
    );

    const [predictions, setPredictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    /** ✅ Dialog is controlled HERE */
    const [dialogOpen, setDialogOpen] = useState(true);

    const resetPredictions = () => {
        setPeriod(null);
        setSelectedRegulator(null);
        setPredictions([]);
        setLoading(false);
        setDialogOpen(true); // ✅ reopen dialog
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-dashed border-2 border-indigo-300 bg-indigo-50/40">
                <CardHeader className="flex flex-row items-center gap-3">
                    <TrendingUp className="size-6 text-indigo-600" />
                    <div>
                        <CardTitle>Predictive Analytics</CardTitle>
                        <p className="text-sm text-gray-600">
                            Forecasted data based on historical regulator analytics
                        </p>
                    </div>
                </CardHeader>
            </Card>

            {/* ✅ Controlled Dialog */}
            <PredictionPeriodDialog
                open={dialogOpen}
                regulators={regulators}
                decodedRegulatorId={decodedRegulatorId}
                onClose={() => setDialogOpen(false)}
                onConfirm={(regulator, months) => {
                    setSelectedRegulator(regulator);
                    setPeriod(months);
                    setDialogOpen(false);
                }}
            />

            {/* Predictions */}
            {period && selectedRegulator && (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600">
                                Regulator: {selectedRegulator}
                            </Badge>
                            <Badge variant="outline">
                                Forecast: {period} months
                            </Badge>
                        </div>

                        <Button variant="outline" onClick={resetPredictions}>
                            Reset Predictions
                        </Button>
                    </div>

                    <OperatorPredictionCharts
                        regulatorAnalytics={regulatorAnalytics}
                        selectedRegulator={selectedRegulator}
                        period={period}
                        predictions={predictions}
                        setPredictions={setPredictions}
                        loading={loading}
                        setLoading={setLoading}
                    />
                </>
            )}
        </div>
    );
}