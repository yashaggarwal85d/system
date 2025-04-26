import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Lightbulb } from "lucide-react";

interface SpendingSuggestionsProps {
  suggestions: string[];
}

const SpendingSuggestions: React.FC<SpendingSuggestionsProps> = ({
  suggestions,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          Spending Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5">
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default SpendingSuggestions;
