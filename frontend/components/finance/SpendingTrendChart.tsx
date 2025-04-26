import React, { useMemo } from "react";
import { CategorizedTransaction } from "@/lib/utils/interfaces";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/common/chart";
import { parseISO, format } from "date-fns";

type PeriodOption =
  | "currentMonth"
  | "previousMonth"
  | "last7Days"
  | "last30Days"
  | "allTime";

interface SpendingTrendChartProps {
  transactions: CategorizedTransaction[];
  period: PeriodOption;
}

const chartConfig = {
  amount: {
    label: "Spending",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const getChartTitle = (period: PeriodOption): string => {
  switch (period) {
    case "currentMonth":
      return "Current Month Spending Trend";
    case "previousMonth":
      return "Previous Month Spending Trend";
    case "last7Days":
      return "Last 7 Days Spending Trend";
    case "last30Days":
      return "Last 30 Days Spending Trend";
    case "allTime":
      return "All Time Spending Trend";
    default:
      return "Spending Trend";
  }
};

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  transactions,
  period,
}) => {
  const trendData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const dailyTotals = transactions.reduce((acc, transaction) => {
      if (transaction.CrDr === "DR") {
        try {
          const dateStr = format(parseISO(transaction.Timestamp), "yyyy-MM-dd");
          acc[dateStr] = (acc[dateStr] || 0) + transaction.Amount;
        } catch (e) {
          console.error(
            "Error parsing date for trend:",
            transaction.Timestamp,
            e
          );
        }
      }
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, period]);

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getChartTitle(period)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground p-4">
            No spending data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle(period)}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use ChartContainer */}
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={trendData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} /> {/* Use themed grid */}
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            {/* Use themed Tooltip */}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) =>
                    typeof value === "number" ? value.toFixed(2) : value
                  }
                />
              }
            />
            {/* Use themed Legend */}
            <ChartLegend content={<ChartLegendContent />} />
            {/* Use themed Line */}
            <Line
              dataKey="amount"
              type="monotone"
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SpendingTrendChart;
