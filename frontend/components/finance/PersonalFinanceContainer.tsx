import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  useMemo,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/common/alert";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select";
import { CategorizedTransaction } from "@/lib/utils/interfaces";
import { fetchFinanceData, uploadRawFile } from "@/lib/utils/apiUtils";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subWeeks,
  parseISO,
  isWithinInterval,
} from "date-fns";
import ExpenseComparisonChart from "./ExpenseComparisonChart";
import PeriodDistributionChart from "./PeriodDistributionChart";
import SpendingTrendChart from "./SpendingTrendChart";
import SpendingSuggestions from "./SpendingSuggestions";
import TransactionHistoryTable from "./TransactionHistoryTable";

type PeriodOption =
  | "currentMonth"
  | "previousMonth"
  | "last7Days"
  | "last30Days"
  | "allTime";

const PersonalFinanceContainer = () => {
  const [transactions, setTransactions] = useState<
    CategorizedTransaction[] | null
  >(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodOption>("currentMonth");

  const getDateRange = (
    period: PeriodOption
  ): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (period) {
      case "currentMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "previousMonth":
        const prevMonth = subMonths(now, 1);
        return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
      case "last7Days":
        return { start: subWeeks(now, 1), end: now };
      case "last30Days":
        return { start: subMonths(now, 1), end: now };
      case "allTime":
      default:
        return null;
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFinanceData();
      setTransactions(data.transactions);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error("Failed to fetch finance data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching data."
      );
      setTransactions([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const range = getDateRange(selectedPeriod);
    if (!range) return transactions;

    return transactions.filter((t) => {
      try {
        const transactionDate = parseISO(t.Timestamp);
        return isWithinInterval(transactionDate, range);
      } catch (e) {
        console.error("Error parsing date:", t.Timestamp, e);
        return false;
      }
    });
  }, [transactions, selectedPeriod]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadRawFile(selectedFile);
      setSelectedFile(null);

      if (result.failed > 0) {
        setError(
          `File processed, but ${result.failed} transaction(s) failed to import. Added: ${result.added}, Skipped/Duplicates: ${result.skipped}.`
        );
      } else if (result.added === 0 && result.skipped > 0) {
        setError(
          `File processed. No new transactions added (Added: ${result.added}, Skipped/Duplicates: ${result.skipped}).`
        );
      } else {
        console.log(
          `File upload successful: Added ${result.added}, Skipped ${result.skipped}`
        );
      }

      await loadData();
    } catch (err) {
      console.error("Failed to upload file:", err);

      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during upload."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const hasData = filteredTransactions && filteredTransactions.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Finance Dashboard</CardTitle>
        {/* Period Selector */}
        <div className="w-[200px]">
          <Select
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="currentMonth">Current Month</SelectItem>
              <SelectItem value="previousMonth">Previous Month</SelectItem>
              <SelectItem value="last7Days">Last 7 Days</SelectItem>
              <SelectItem value="last30Days">Last 30 Days</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section (remains the same) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              id="transactionFile"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf"
              onChange={handleFileChange}
              className="flex-grow file:mr-4 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isUploading}
            />
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading financial data...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Data Display Section - uses filteredTransactions */}
        {!isLoading && (
          <>
            {hasData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Charts */}
                {/* ExpenseComparisonChart needs ALL transactions for comparison */}
                <ExpenseComparisonChart
                  transactions={transactions || []}
                  period={selectedPeriod}
                />
                <PeriodDistributionChart
                  transactions={filteredTransactions}
                  period={selectedPeriod}
                />
                <SpendingTrendChart
                  transactions={filteredTransactions}
                  period={selectedPeriod}
                />
                {/* Suggestions - Still uses overall suggestions for now */}
                <SpendingSuggestions suggestions={suggestions || []} />
                {/* Transaction History - Pass filtered data */}
                <div className="lg:col-span-2">
                  <TransactionHistoryTable
                    transactions={filteredTransactions}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Message when no data is available for the selected period (and not loading/erroring) */}
                {!error && transactions && transactions.length > 0 && (
                  <p className="text-center text-muted-foreground">
                    No transaction data available for the selected period.
                  </p>
                )}
                {/* Message when no data exists at all */}
                {!error && (!transactions || transactions.length === 0) && (
                  <p className="text-center text-muted-foreground">
                    No transaction data available. Upload a file to get started.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalFinanceContainer;
