"use client";

import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { useState, useEffect } from "react";
import { Sparkles, Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Habit } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
  getDeadlineColor,
  getDeadlineText,
  getRefreshColor,
  getRefreshText,
  getRemainingTime,
  parseDate,
} from "@/lib/utils/commonUtils";

interface HabitItemProps extends Habit {
  id: string;
  onToggle: (currentlyCompleted: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  refreshHabit: () => void;
}

export const HabitItem = ({
  name,
  aura,
  start_date,
  last_completed,
  occurence,
  x_occurence,
  onToggle,
  onDelete,
  onEdit,
  refreshHabit,
}: HabitItemProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleToggle = () => {
    onToggle(!isCompleted);
    setIsCompleted(!isCompleted);
  };
  const handleDelete = () => onDelete();

  useEffect(() => {
    var lc = parseDate(last_completed);
    var sd = parseDate(start_date);
    lc.setHours(0, 0, 0, 0);
    sd.setHours(0, 0, 0, 0);
    if (lc.getTime() <= sd.getTime()) {
      setIsCompleted(false);
    } else {
      setIsCompleted(true);
    }
  }, [last_completed]);

  useEffect(() => {
    var now = new Date();
    var nc = parseDate(
      calculateNextDueDate(start_date, occurence, x_occurence)
    );
    now.setHours(0, 0, 0, 0);
    nc.setHours(0, 0, 0, 0);
    if (now >= nc) {
      refreshHabit();
    }
  }, [isCompleted]);

  const is_good = aura >= 0;
  const due_date = calculateNextDueDate(start_date, occurence, x_occurence);
  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        },
      }}
    >
      <Card
        className={`bg-secondary/60 border transition-colors group ${
          // Use secondary
          !is_good
            ? "border-destructive/20 hover:border-destructive/40" // Use destructive
            : "border-primary/20 hover:border-primary/40" // Use primary
        }`}
      >
        {/* Replicate TaskItem structure */}
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Checkbox for toggling */}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className={`${
                !is_good
                  ? "border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" // Use destructive
                  : "border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Use primary
              }`}
            />
            {/* Text content */}
            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`font-medium ${
                  !is_good ? "text-destructive" : "text-primary" // Use destructive/primary
                } ${isCompleted ? "line-through opacity-50" : ""}`}
              >
                {name}
              </span>
              {/* Show frequency and next due only if not completed */}
              {!isCompleted && (
                <>
                  <span className="text-xs text-info">
                    {" "}
                    {/* Use info */}
                    Every {x_occurence} {occurence}
                  </span>
                  <span className={`text-xs ${getDeadlineColor(due_date)}`}>
                    Next due: {getDeadlineText(due_date)}
                  </span>
                </>
              )}
              {isCompleted && (
                <span
                  className={`text-xs ${getRefreshColor(
                    start_date,
                    occurence,
                    x_occurence
                  )}`}
                >
                  Refresh{getRefreshText(start_date, occurence, x_occurence)}
                </span>
              )}
            </div>
          </div>
          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Show Aura badge only when completed */}
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Badge
                  variant="outline"
                  className={`${
                    !is_good
                      ? "bg-destructive/10 border-destructive/30 text-destructive" // Use destructive
                      : "bg-primary/10 border-primary/30 text-primary" // Use primary
                  }`}
                >
                  {is_good ? "+" : "-"}
                  {Math.abs(aura)} Aura {/* Ensure aura is positive */}
                </Badge>
                {is_good && <Sparkles className="h-4 w-4 text-primary/50" />}{" "}
                {/* Use primary */}
              </motion.div>
            )}

            {/* Edit Button */}
            {onEdit && !isCompleted && (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" // Use foreground
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" // Use destructive
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
