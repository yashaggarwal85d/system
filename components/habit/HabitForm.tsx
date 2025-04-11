import React from "react";
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Checkbox } from "@/components/common/checkbox";

import { NumberWheelPicker } from "@/components/common/number-wheel-picker";
import { PeriodWheelPicker } from "@/components/common/period-wheel-picker";
import { Habit } from "@/lib/utils/interfaces";

interface HabitFormProps {
  habitText: string;
  setHabitText: (value: string) => void;
  habitConfig: {
    period: "days" | "weeks" | "months";
    value: number;
    isGoodHabit: boolean;
  };
  setHabitConfig: (config: HabitFormProps["habitConfig"]) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleSaveHabit: () => void;
  setShowHabitForm: (value: boolean) => void;
  setEditingHabit: (habit: Habit | null) => void;
  editingHabit: Habit | null;
}

const HabitForm: React.FC<HabitFormProps> = ({
  habitText,
  setHabitText,
  habitConfig,
  setHabitConfig,
  error,
  setError,
  handleSaveHabit,
  setShowHabitForm,
  setEditingHabit,
  editingHabit,
}) => {
  const handleCancel = () => {
    setShowHabitForm(false);
    setHabitText("");
    setHabitConfig({
      period: "days",
      value: 1,
      isGoodHabit: true,
    });
    setError(null);
    setEditingHabit(null);
  };

  const handleConfigChange = <K extends keyof HabitFormProps["habitConfig"]>(
    key: K,
    value: HabitFormProps["habitConfig"][K]
  ) => {
    setError(null);
    setHabitConfig({ ...habitConfig, [key]: value });
  };

  return (
    <Card className="w-full max-w-md bg-secondary/95 border-primary/20">
      {" "}
      {/* Use theme colors */}
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary mb-4">
          {" "}
          {/* Use primary */}
          {editingHabit ? "Edit Habit" : "Add Habit"}
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-primary">Name:</span> {/* Use primary */}
            <Input
              value={habitText}
              onChange={(e) => {
                setError(null);
                setHabitText(e.target.value);
              }}
              className="bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30" // Use theme colors
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-primary">Repeat Every:</span>{" "}
            {/* Use primary */}
            <div className="flex items-center gap-2 p-2 rounded border border-primary/20 bg-secondary/60 justify-center">
              {" "}
              {/* Use theme colors */}
              <NumberWheelPicker
                label="Value"
                value={habitConfig.value}
                onChange={(value) => handleConfigChange("value", value)}
                min={1}
                max={30}
              />
              <PeriodWheelPicker
                value={habitConfig.period}
                onChange={(value) => handleConfigChange("period", value)}
              />
            </div>
          </div>

          {/* Removed TimePicker section */}

          <div className="flex items-center gap-2 justify-center">
            <Checkbox
              id="good-habit-checkbox"
              checked={habitConfig.isGoodHabit}
              onCheckedChange={(checked) =>
                handleConfigChange("isGoodHabit", checked as boolean)
              }
              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Use primary
            />
            <label htmlFor="good-habit-checkbox" className="text-primary">
              {" "}
              {/* Use primary */}
              Good habit
            </label>{" "}
            {/* Use label */}
          </div>
        </div>

        {error && (
          <span className="text-destructive text-sm mt-1 text-center block">
            {error}
          </span>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={handleCancel}
            className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50" // Use theme colors
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveHabit}
            className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50" // Use theme colors
          >
            {editingHabit ? "Save Changes" : "Add Habit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitForm;
