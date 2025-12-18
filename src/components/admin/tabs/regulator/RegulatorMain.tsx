import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Users, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {managementAPI, reportsAPI} from "@/utils/API.ts";

export function RegulatorMain() {
    const [totalReports, setTotalReports] = useState<number>(0);
    const [totalRegulators, setTotalRegulators] = useState<number>(0);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const reportsRes = await reportsAPI.getRegulatorReports();
                console.log("report res", reportsRes);
                setTotalReports(Array.isArray(reportsRes) ? reportsRes.length : 0);

                const regulatorsRes = await managementAPI.getRegulators();
                console.log("regulatorsRes", regulatorsRes);
                setTotalRegulators(
                    Array.isArray(regulatorsRes) ? regulatorsRes.length : 0
                );
            } catch (error) {
                console.error("Failed to fetch regulator metrics", error);
            }
        };

        fetchMetrics();
    }, []);

    const cards = [
        {
            title: "Total Reports",
            value: totalReports,
            icon: FileCheck,
            trend: 0,
            trendType: "neutral",
        },
        {
            title: "Regulators Registered",
            value: totalRegulators,
            icon: Users,
            trend: 0,
            trendType: "neutral",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {cards.map((card, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>{card.title}</CardTitle>
                            <card.icon className="text-indigo-600" />
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-full">
                            <p className="text-2xl font-bold">{card.value}</p>
                            {card.trendType !== "neutral" && (
                                <span
                                    className={`flex items-center text-sm mt-2 ${
                                        card.trendType === "up" ? "text-green-600" : "text-red-600"
                                    }`}
                                >
                  {card.trendType === "up" ? <ArrowUp className="mr-1" /> : <ArrowDown className="mr-1" />}
                                    {Math.abs(card.trend)}% from last month
                </span>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}