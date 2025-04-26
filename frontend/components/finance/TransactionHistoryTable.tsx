import React from "react";
import { CategorizedTransaction } from "@/lib/utils/interfaces";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table";
import { useMemo } from "react";
import { parseISO } from "date-fns";

interface TransactionHistoryTableProps {
  transactions: CategorizedTransaction[];
}

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  transactions,
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No transactions available.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return timestamp;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    });
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      try {
        const dateA = parseISO(a.Timestamp);
        const dateB = parseISO(b.Timestamp);

        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        console.error("Error parsing date for sorting:", e);
        return 0;
      }
    });
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Wrapper div for scrolling */}
        <div className="h-[300px] w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Map over the sorted array */}
              {sortedTransactions.map((transaction) => (
                <TableRow
                  key={
                    transaction.id || transaction.Timestamp + transaction.Amount
                  }
                >
                  <TableCell>{formatDate(transaction.Timestamp)}</TableCell>
                  <TableCell>{transaction.Category}</TableCell>
                  <TableCell>{transaction.Description || "-"}</TableCell>
                  <TableCell
                    className={`text-right ${
                      transaction.CrDr === "CR"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.CrDr === "CR" ? "+" : "-"}
                    {formatCurrency(transaction.Amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistoryTable;
