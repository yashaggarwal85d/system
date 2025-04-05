import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Checkbox } from "@/components/common/checkbox";
import { TimePicker } from "@/components/common/time-picker";
import { NumberWheelPicker } from "@/components/common/number-wheel-picker";
import { PeriodWheelPicker } from "@/components/common/period-wheel-picker";
import { HabitFormProps } from "@/lib/interfaces/habit";

const HabitForm: React.FC<HabitFormProps> = ({
  newTaskText,
  setNewTaskText,
  habitConfig,
  setHabitConfig,
  setShowHabitConfig,
  setEditingHabit,
  handleSaveHabit,
  editingHabit,
}) => {
  const handleCancel = () => {
    setShowHabitConfig(false);
    setNewTaskText("");

    const currentTime = habitConfig.time;
    setHabitConfig({
      count: 1,
      period: "days",
      value: 1,
      time: currentTime,
      isGoodHabit: true,
    });
    setEditingHabit(null);
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
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Frequency:</span>
            <div className="flex items-center gap-2">
              <NumberWheelPicker
                label="Count"
                value={habitConfig.count}
                onChange={(value) =>
                  setHabitConfig({ ...habitConfig, count: value })
                }
                min={1}
                max={10}
              />
              <span className="text-[#4ADEF6]">times per</span>
              <NumberWheelPicker
                label="Value"
                value={habitConfig.value}
                onChange={(value) => setHabitConfig({ ...habitConfig, value })}
                min={1}
                max={30}
              />
              <PeriodWheelPicker
                value={habitConfig.period}
                onChange={(value) =>
                  setHabitConfig({ ...habitConfig, period: value })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Time:</span>
            <TimePicker
              value={habitConfig.time}
              onChange={(value) =>
                setHabitConfig({ ...habitConfig, time: value })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={habitConfig.isGoodHabit}
              onCheckedChange={(checked) =>
                setHabitConfig({
                  ...habitConfig,
                  isGoodHabit: checked as boolean,
                })
              }
              className="border-[#4ADEF6]/50 data-[state=checked]:bg-[#4ADEF6] data-[state=checked]:border-[#4ADEF6]"
            />
            <span className="text-[#4ADEF6]">Good habit</span>
          </div>
        </div>

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
