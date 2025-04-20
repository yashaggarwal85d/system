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
  getDeadlineColor,
  getDeadlineText,
  getRefreshColor,
  getRefreshText,
  parseDate,
} from "@/lib/utils/commonUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/common/alert-dialog";

interface HabitItemProps extends Habit {
  id: string;
  onToggle: (currentlyCompleted: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  refreshHabit: () => void;
}

export const HabitItem = ({
  name,
  description,
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
    if (isCompleted) {
      var now = new Date();
      var nc = parseDate(
        calculateNextDueDate(start_date, occurence, x_occurence)
      );
      now.setHours(0, 0, 0, 0);
      nc.setHours(0, 0, 0, 0);
      if (now >= nc) {
        refreshHabit();
      }
    }
  }, [isCompleted]);

  const is_good = aura >= 0;
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
          !is_good
            ? "border-destructive/20 hover:border-destructive/40"
            : "border-primary/20 hover:border-primary/40"
        }`}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className={`${
                !is_good
                  ? "border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  : "border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              }`}
            />

            <div className="flex flex-col flex-1 min-w-0">
              <span
                className={`font-medium ${
                  !is_good ? "text-destructive" : "text-primary"
                } ${isCompleted ? "line-through opacity-50" : ""}`}
              >
                {name}
              </span>

              {description && (
                <span className="text-xs text-muted-foreground mt-1 truncate">
                  {description}
                </span>
              )}
              <span className="text-xs text-info">
                {" "}
                Every {x_occurence} {occurence}
              </span>
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

          <div className="flex items-center gap-2">
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
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-primary/10 border-primary/30 text-primary"
                  }`}
                >
                  {is_good ? "+" : "-"}
                  {Math.abs(aura)} Aura {}
                </Badge>
                {is_good && <Sparkles className="h-4 w-4 text-primary/50" />} {}
              </motion.div>
            )}

            {onEdit && !isCompleted && (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this habit.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Habit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
