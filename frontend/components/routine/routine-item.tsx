"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/common/card";
import { Checkbox } from "@/components/common/checkbox";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Sparkles, Trash2, Pencil, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import { ChecklistItem } from "@/components/common/checklist-item";
import useRoutineStore from "@/store/routineStore";
import { BorderBeam } from "@/components/common/border-beam";
import useDashboardStore from "@/store/dashboardStore";

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

interface RoutineItemProps extends Routine {
  id: string;
  onToggle: (currentlyCompleted: boolean) => void;
  onDelete: () => void;
  onEdit?: () => void;
  refreshRoutine: () => void;
}

export const RoutineItem = ({
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
  refreshRoutine,
  checklist,

  id,
  onUpdateChecklist,
}: RoutineItemProps & {
  onUpdateChecklist?: (checklist: ChecklistItemData[]) => void;
}) => {
  const currentTheme = useDashboardStore((state) => state.currentTheme);
  const { updateEntity: updateRoutine } = useRoutineStore();
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

      return items.map((item) => (
        <React.Fragment key={item.id}>
          <ChecklistItem
            item={item}
            onUpdate={handleUpdateChecklistItem}
            onDelete={() => {}}
            onIndent={() => {}}
            onOutdent={() => {}}
            onEnter={() => {}}
            onFocus={() => {}}
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
    if (isCompleted) {
      var now = new Date();
      var nc = parseDate(
        calculateNextDueDate(start_date, occurence, x_occurence)
      );
      now.setHours(0, 0, 0, 0);
      nc.setHours(0, 0, 0, 0);
      if (now >= nc) {
        refreshRoutine();
      }
    }
  }, [isCompleted]);

  useEffect(() => {
    setChecklistState(checklist ? JSON.parse(JSON.stringify(checklist)) : []);
  }, [checklist]);
  const is_good = aura >= 0;
  const due_date = calculateNextDueDate(start_date, occurence, x_occurence);
  return (
    <motion.div
      layout
      layoutId={id}
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
        className={`relative overflow-hidden bg-secondary border transition-colors group ${
          !is_good
            ? "border-destructive/20 hover:border-destructive/40"
            : "border-primary/20 hover:border-primary/40"
        }`}
      >
        {!isCompleted && (
          <>
            <BorderBeam
              colorFrom={currentTheme.primary.DEFAULT}
              colorTo={currentTheme.accent.DEFAULT}
              size={600}
              delay={10}
              duration={20}
            />
            <BorderBeam
              colorFrom={currentTheme.primary.DEFAULT}
              colorTo={currentTheme.accent.DEFAULT}
              size={600}
              duration={20}
            />
          </>
        )}
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
              {!isCompleted && (
                <span className={`text-xs ${getDeadlineColor(due_date)}`}>
                  Next due: {getDeadlineText(due_date)}
                </span>
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
                    this routine.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Routine
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {checklistState && checklistState.length > 0 && (
              <Button
                onClick={() => setShowChecklist(!showChecklist)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>

        <AnimatePresence>
          {showChecklist && checklistState && checklistState.length > 0 && (
            <motion.div
              key="checklist"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-4 pt-0 overflow-hidden"
            >
              <div className="border-t border-primary/20 pt-3 mt-2 space-y-2">
                {" "}
                <h4 className="text-sm font-medium text-primary/80 mb-2">
                  {" "}
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
