import React from "react"; // Import React
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Checkbox } from "@/components/common/checkbox";
// Removed TimePicker import
import { NumberWheelPicker } from "@/components/common/number-wheel-picker";
import { PeriodWheelPicker } from "@/components/common/period-wheel-picker";
import { Habit } from "@/lib/utils/interfaces"; // Import Habit interface

// Define the props interface, mirroring TaskForm structure
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
    <Card className="w-full max-w-md bg-[#0A1A2F]/95 border-[#4ADEF6]/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-[#4ADEF6] mb-4">
          {editingHabit ? "Edit Habit" : "Add Habit"}
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Name:</span>
            <Input
              value={habitText}
              onChange={(e) => {
                setError(null); // Clear error on name change
                setHabitText(e.target.value);
              }}
              className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Repeat Every:</span>
            <div className="flex items-center gap-2 p-2 rounded border border-[#4ADEF6]/20 bg-[#0A1A2F]/60 justify-center">
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
              className="border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
            />
            <label htmlFor="good-habit-checkbox" className="text-[#4ADEF6]">
              Good habit
            </label>{" "}
            {/* Use label */}
          </div>
        </div>

        {error && (
          <span className="text-red-500 text-sm mt-1 text-center block">
            {error}
          </span>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={handleCancel}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveHabit}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            {editingHabit ? "Save Changes" : "Add Habit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitForm;
