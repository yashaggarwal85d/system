"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { TimePicker } from "@/components/common/time-picker";
import { NumberWheelPicker } from "@/components/common/number-wheel-picker";
import { PeriodWheelPicker } from "@/components/common/period-wheel-picker";
import { Reorder, useDragControls } from "framer-motion";
import {
  ChecklistItem,
  ChecklistItemData,
} from "@/components/common/checklist-item";
import { Frequency, Routine, RoutineFormProps } from "@/lib/interfaces/routine";

const createNewChecklistItem = (level: number = 0): ChecklistItemData => ({
  id: Math.random().toString(36).substring(7),
  text: "",
  completed: false,
  level,
  children: [],
});

const RoutineForm = ({
  initialName = "",
  onNameChange,
  onSave,
  onClose,
  initialRoutine,
}: RoutineFormProps) => {
  const [name, setName] = useState(initialName);
  const [frequency, setFrequency] = useState<Frequency>(() => {
    if (initialRoutine?.frequency) {
      return initialRoutine.frequency;
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return {
      count: 1,
      period: "days",
      value: 1,
      time: `${hours}:${minutes}`,
    };
  });
  const [checklist, setChecklist] = useState<ChecklistItemData[]>(() => {
    if (initialRoutine?.checklist) {
      return initialRoutine.checklist;
    }
    return [
      {
        id: Math.random().toString(36).substring(7),
        text: "",
        completed: false,
        level: 0,
        children: [],
      },
    ];
  });
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const dragControls = useDragControls();

  const handleUpdate = (id: string, updates: Partial<ChecklistItemData>) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDelete = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleIndent = (id: string) => {
    setChecklist((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index <= 0) return prev;

      const prevItem = prev[index - 1];
      const currentItem = prev[index];

      const newItem = {
        ...currentItem,
        level: currentItem.level + 1,
      };

      const newList = [...prev];
      newList[index] = newItem;
      return newList;
    });
  };

  const handleOutdent = (id: string) => {
    setChecklist((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const currentItem = prev[index];

      const newItem = {
        ...currentItem,
        level: Math.max(0, currentItem.level - 1),
      };

      const newList = [...prev];
      newList[index] = newItem;
      return newList;
    });
  };

  const handleEnter = (id: string, level: number) => {
    const newItem = createNewChecklistItem(level);
    setChecklist((prev) => {
      if (prev.length === 0 || !id) {
        return [{ ...newItem, level: 0 }];
      }

      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) {
        return [...prev, newItem];
      }

      const newList = [...prev];
      newList.splice(index + 1, 0, newItem);
      return newList;
    });
    setActiveItemId(newItem.id);
  };

  const handleReorder = (newOrder: ChecklistItemData[]) => {
    if (!Array.isArray(newOrder)) return;
    setChecklist(
      newOrder.map((item) => ({
        ...item,
        level: item.level || 0,
        children: item.children || [],
      }))
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      // Basic validation, could add more for checklist items if needed
      alert("Please enter a routine name.");
      return;
    }

    // Construct only the data needed for creation/update
    const routineDataForSave = {
      name,
      frequency,
      checklist: checklist.map((item) => ({
        id: item.id, // Keep ID for updates
        text: item.text || "",
        completed: !!item.completed,
        level: item.level || 0,
        // No need to pass children
      })),
      // Omit fields like id, createdAt, updatedAt, completed, nextDue, lastCompleted, userId, auraValue
      // as they are handled by the backend or store logic
    };

    // Pass the correctly shaped data to the onSave callback
    // The type assertion might be needed if TS can't infer the Omit type correctly here
    onSave(
      routineDataForSave as Omit<
        Routine,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "completed"
        | "nextDue"
        | "lastCompleted"
        | "userId"
        | "auraValue"
      >
    );
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Card className="w-full max-w-2xl bg-[#0A1A2F]/95 border-[#4ADEF6]/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#4ADEF6] mb-4">
            {initialRoutine ? "Edit Routine" : "Add Routine"}
          </h3>
          <div className="space-y-4">
            <Input
              placeholder="Routine name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onNameChange?.(e.target.value);
              }}
              className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
            />
          </div>

          <div className="space-y-6 mt-6">
            <h3 className="text-lg font-semibold text-[#4ADEF6]">Frequency</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <NumberWheelPicker
                  value={frequency.count}
                  onChange={(count: number) =>
                    setFrequency((prev: Frequency) => ({ ...prev, count }))
                  }
                  min={1}
                  max={10}
                  label="Count"
                />
                <span className="text-[#4ADEF6]">times per</span>
                <NumberWheelPicker
                  value={frequency.value}
                  onChange={(value: number) =>
                    setFrequency((prev: Frequency) => ({ ...prev, value }))
                  }
                  min={1}
                  max={100}
                  label="Value"
                />
                <PeriodWheelPicker
                  value={frequency.period}
                  onChange={(period: "days" | "weeks" | "months") =>
                    setFrequency((prev: Frequency) => ({ ...prev, period }))
                  }
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#4ADEF6]">at</span>
                <TimePicker
                  value={frequency.time}
                  onChange={(newTime: string) => {
                    setFrequency((prev: Frequency) => ({
                      ...prev,
                      time: newTime,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-6">
            <h3 className="text-lg font-semibold text-[#4ADEF6]">Checklist</h3>

            <Reorder.Group
              axis="y"
              values={checklist}
              onReorder={handleReorder}
              className="space-y-1"
            >
              {checklist.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onIndent={handleIndent}
                  onOutdent={handleOutdent}
                  onEnter={handleEnter}
                  onFocus={(id) => setActiveItemId(id)}
                  isEditing={item.id === activeItemId}
                  dragControls={dragControls}
                />
              ))}
            </Reorder.Group>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={onClose}
              className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
            >
              {initialRoutine ? "Save Changes" : "Add Routine"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoutineForm;
