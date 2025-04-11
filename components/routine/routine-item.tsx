"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Sparkles, Trash2, Pencil, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import { ChecklistItem } from "@/components/common/checklist-item";
import useRoutineStore from "@/store/routineStore";

import {
  calculateNextDueDate,
  getDeadlineColor,
  getDeadlineText,
  getRefreshColor,
  getRefreshText,
  parseDate,
} from "@/lib/utils/commonUtils";

interface RoutineItemProps extends Routine {
  id: string;
  onToggle: (currentlyCompleted: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  refreshRoutine: () => void;
}

export const RoutineItem = ({
  name,
  aura,
  start_date,
  last_completed,
  occurence,
  x_occurence,
  onToggle,
  onDelete,
  onEdit,
  refreshRoutine,
  checklist,

  id,
  onUpdateChecklist,
}: RoutineItemProps & {
  onUpdateChecklist?: (checklist: ChecklistItemData[]) => void;
}) => {
  const { updateRoutine } = useRoutineStore();
  const [isCompleted, setIsCompleted] = useState(false);
  const [checklistState, setChecklistState] = useState<ChecklistItemData[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleUpdateChecklistItem = useCallback(
    (
      itemId: string,
      updates: Partial<Pick<ChecklistItemData, "text" | "completed">>
    ) => {
      const updateItemRecursively = (
        items: ChecklistItemData[]
      ): ChecklistItemData[] => {
        return items.map((item) => {
          if (item.id === itemId) {
            return { ...item, ...updates };
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateItemRecursively(item.children) };
          }
          return item;
        });
      };

      const newChecklistState = updateItemRecursively(checklistState);

      setChecklistState(newChecklistState);

      updateRoutine(id, { checklist: newChecklistState });

      if (onUpdateChecklist) {
        onUpdateChecklist(newChecklistState);
      }
    },
    [checklistState, id, updateRoutine, onUpdateChecklist]
  );

  const renderChecklistItems = useCallback(
    (items: ChecklistItemData[]) => {
      if (!Array.isArray(items)) {
        console.error("renderChecklistItems received non-array:", items);
        return null;
      }
      // Recursively render items and their children
      return items.map((item) => (
        <React.Fragment key={item.id}>
          <ChecklistItem
            item={item}
            onUpdate={handleUpdateChecklistItem}
            onDelete={() => {}} // Placeholder - not needed in read-only view
            onIndent={() => {}} // Placeholder - not needed in read-only view
            onOutdent={() => {}} // Placeholder - not needed in read-only view
            onEnter={() => {}} // Placeholder - not needed in read-only view
            onFocus={() => {}} // Placeholder - not needed in read-only view
            isReadOnly={true}
          />
          {item.children &&
            item.children.length > 0 &&
            renderChecklistItems(item.children)}
        </React.Fragment>
      ));
    },
    [handleUpdateChecklistItem]
  );
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
  }, [last_completed, start_date]);
  useEffect(() => {
    var now = new Date();
    var nc = parseDate(
      calculateNextDueDate(start_date, occurence, x_occurence)
    );
    now.setHours(0, 0, 0, 0);
    nc.setHours(0, 0, 0, 0);
    if (now >= nc) {
      refreshRoutine();
    }
  }, [isCompleted, start_date, occurence, x_occurence, refreshRoutine]);

  useEffect(() => {
    setChecklistState(checklist ? JSON.parse(JSON.stringify(checklist)) : []);
  }, [checklist]);
  const is_good = aura >= 0;
  const due_date = calculateNextDueDate(start_date, occurence, x_occurence);
  return (
    <motion.div
      layout // Add layout prop for reordering animation
      layoutId={id} // Add layoutId for tracking
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

            {/* Checklist Toggle Button */}
            {checklistState && checklistState.length > 0 && (
              <Button
                onClick={() => setShowChecklist(!showChecklist)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" // Use foreground
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>

        {/* Checklist Section */}
        <AnimatePresence>
          {showChecklist && checklistState && checklistState.length > 0 && (
            <motion.div
              key="checklist" // Add key for AnimatePresence
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} // Simple transition
              className="px-4 pb-4 pt-0 overflow-hidden" // Removed layout={false}
            >
              <div className="border-t border-primary/20 pt-3 mt-2 space-y-2">
                {" "}
                {/* Use primary */}
                <h4 className="text-sm font-medium text-primary/80 mb-2">
                  {" "}
                  {/* Use primary */}
                  Checklist
                </h4>
                <div className="space-y-1">
                  {renderChecklistItems(checklistState)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
