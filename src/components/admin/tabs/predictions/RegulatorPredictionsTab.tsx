"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { PredictionPeriodDialog } from "./PredictionPeriodDialog";
import { OperatorPredictionCharts } from "./OperatorPredictionCharts";
import type { RegulatorAnalytics } from "@/components/admin/AdminRegulatorDataTables";

interface Props {
    regulatorAnalytics: RegulatorAnalytics[];
    selectedRegulator: string;
}

export function RegulatorPredictionsTab({
                                            regulatorAnalytics,
                                            selectedRegulator,
                                        }: Props) {
    const [period, setPeriod] = useState<number | null>(null);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

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

            {/* No period selected */}
            {!period && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="size-8 text-amber-500 mx-auto mb-3" />
                        <p className="font-semibold mb-2">
                            Select a prediction period to continue
                        </p>
                        <PredictionPeriodDialog
                            onConfirm={(p) => setPeriod(p)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Predictions */}
            {period && (
                <>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600">
                            Forecast: {period} months
                        </Badge>
                        <Badge variant="outline">
                            Predicted Data
                        </Badge>
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