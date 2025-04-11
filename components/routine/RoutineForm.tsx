import React from "react";
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Checkbox } from "@/components/common/checkbox";

import { NumberWheelPicker } from "@/components/common/number-wheel-picker";
import { PeriodWheelPicker } from "@/components/common/period-wheel-picker";
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import { Trash2, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ChecklistItem, ChecklistItemHandle } from "../common/checklist-item"; // Import handle type
import { Reorder, useDragControls } from "framer-motion";

interface RoutineFormProps {
  routineText: string;
  setRoutineText: (value: string) => void;
  routineConfig: {
    period: "days" | "weeks" | "months";
    value: number;
    isGoodRoutine: boolean;
  };
  setRoutineConfig: (
    config: Omit<RoutineFormProps["routineConfig"], "checklist">
  ) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleSaveRoutine: (checklist: ChecklistItemData[]) => void;
  setShowRoutineForm: (value: boolean) => void;
  setEditingRoutine: (routine: Routine | null) => void;
  editingRoutine: Routine | null;
}

const flattenChecklist = (items: ChecklistItemData[]): ChecklistItemData[] => {
  const flatList: ChecklistItemData[] = [];
  const traverse = (item: ChecklistItemData) => {
    flatList.push(item);
    if (item.children && item.children.length > 0) {
      item.children.forEach(traverse);
    }
  };
  items.forEach(traverse);
  return flatList;
};

const unflattenChecklist = (
  flatList: ChecklistItemData[]
): ChecklistItemData[] => {
  if (!flatList || flatList.length === 0) return [];

  const tree: ChecklistItemData[] = [];
  const map: { [id: string]: ChecklistItemData } = {};
  const parentStack: ChecklistItemData[] = [];

  flatList.forEach((item) => {
    const newItem = { ...item, children: [] };
    map[newItem.id] = newItem;

    while (
      parentStack.length > 0 &&
      newItem.level <= parentStack[parentStack.length - 1].level
    ) {
      parentStack.pop();
    }

    if (parentStack.length === 0) {
      tree.push(newItem);
    } else {
      const parent = parentStack[parentStack.length - 1];
      parent.children = parent.children || [];
      parent.children.push(newItem);
    }

    parentStack.push(newItem);
  });

  return tree;
};

const RoutineForm: React.FC<RoutineFormProps> = ({
  routineText,
  setRoutineText,
  routineConfig,
  setRoutineConfig,
  error,
  setError,
  handleSaveRoutine,
  setShowRoutineForm,
  setEditingRoutine,
  editingRoutine,
}) => {
  const [newItemText, setNewItemText] = React.useState("");
  const [checklistItems, setChecklistItems] = React.useState<
    ChecklistItemData[]
  >([]);
  const dragControls = useDragControls();
  const itemRefs = React.useRef<Record<string, ChecklistItemHandle | null>>({});

  React.useEffect(() => {
    if (editingRoutine && editingRoutine.checklist) {
      setChecklistItems(editingRoutine.checklist);
    } else {
      setChecklistItems([]);
    }
  }, [editingRoutine]);

  const handleCancel = () => {
    setShowRoutineForm(false);
    setRoutineText("");
    setRoutineConfig({
      period: "days",
      value: 1,
      isGoodRoutine: true,
    });
    setNewItemText("");
    setChecklistItems([]);
    setError(null);
    setEditingRoutine(null);
  };

  const handleConfigChange = <
    K extends keyof Omit<RoutineFormProps["routineConfig"], "checklist">
  >(
    key: K,
    value: Omit<RoutineFormProps["routineConfig"], "checklist">[K]
  ) => {
    setError(null);
    setRoutineConfig({ ...routineConfig, [key]: value });
  };

  const handleAddChecklistItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItemData = {
        id: uuidv4(),
        text: newItemText.trim(),
        completed: false,
        level: 0,
        children: [],
      };
      setChecklistItems((prev) => [...prev, newItem]);
      setNewItemText("");
      requestAnimationFrame(() => {
        itemRefs.current[newItem.id]?.focusItem();
      });
    }
  };

  const handleDeleteChecklistItem = (id: string) => {
    const removeItemRecursively = (
      items: ChecklistItemData[],
      targetId: string
    ): ChecklistItemData[] => {
      return items.reduce((acc, item) => {
        if (item.id === targetId) {
          return acc;
        }
        if (item.children && item.children.length > 0) {
          item.children = removeItemRecursively(item.children, targetId);
        }
        acc.push(item);
        return acc;
      }, [] as ChecklistItemData[]);
    };

    setChecklistItems((prevItems) => removeItemRecursively(prevItems, id));
  };

  const handleUpdateChecklistItem = (
    id: string,
    updates: Partial<Pick<ChecklistItemData, "text" | "completed">>
  ) => {
    const updateItemRecursively = (
      items: ChecklistItemData[]
    ): ChecklistItemData[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children && item.children.length > 0) {
          return { ...item, children: updateItemRecursively(item.children) };
        }
        return item;
      });
    };
    setChecklistItems((prevItems) => updateItemRecursively(prevItems));
  };

  const handleReorderChecklist = (newFlatOrder: ChecklistItemData[]) => {
    const newNestedOrder = unflattenChecklist(newFlatOrder);
    setChecklistItems(newNestedOrder);
  };

  const findItemPath = (
    items: ChecklistItemData[],
    targetId: string,
    path: (ChecklistItemData | number)[] = []
  ): (ChecklistItemData | number)[] | null => {
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      const currentPath = [...path, currentItem, i];

      if (currentItem.id === targetId) {
        return currentPath;
      }

      if (currentItem.children && currentItem.children.length > 0) {
        const result = findItemPath(
          currentItem.children,
          targetId,
          currentPath
        );
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const handleIndentChecklistItem = (id: string) => {
    setChecklistItems((prevItems) => {
      const path = findItemPath(prevItems, id);
      if (!path || path.length < 2) return prevItems;

      const itemIndex = path[path.length - 1] as number;
      if (itemIndex === 0) return prevItems;

      const parentListPath = path.slice(0, -2);
      let parentListRef = prevItems;
      if (parentListPath.length > 0) {
        const parentItemRef = parentListPath[
          parentListPath.length - 2
        ] as ChecklistItemData;
        parentListRef = parentItemRef.children || [];
      }

      const previousSibling = parentListRef[itemIndex - 1];
      if (!previousSibling) return prevItems;

      const itemsCopy = JSON.parse(JSON.stringify(prevItems));

      const copiedPath = findItemPath(itemsCopy, id);
      if (!copiedPath) return itemsCopy;

      const copiedItemIndex = copiedPath[copiedPath.length - 1] as number;
      let copiedParentList = itemsCopy;
      let copiedPreviousSibling: ChecklistItemData | null = null;

      if (copiedPath.length > 2) {
        const copiedParentPath = copiedPath.slice(0, -2);
        const copiedParentItem = copiedParentPath[
          copiedParentPath.length - 2
        ] as ChecklistItemData;
        copiedParentList = copiedParentItem.children!;
      }
      copiedPreviousSibling = copiedParentList[copiedItemIndex - 1];

      if (!copiedPreviousSibling) return itemsCopy;

      const itemToIndent = {
        ...copiedParentList[copiedItemIndex],
        level: (previousSibling.level || 0) + 1,
      };

      copiedPreviousSibling.children = copiedPreviousSibling.children || [];
      copiedPreviousSibling.children.push(itemToIndent);
      copiedParentList.splice(copiedItemIndex, 1);

      return itemsCopy;
    });
  };

  const handleOutdentChecklistItem = (id: string) => {
    setChecklistItems((prevItems) => {
      const path = findItemPath(prevItems, id);
      if (!path || path.length <= 2) return prevItems;

      const itemsCopy = JSON.parse(JSON.stringify(prevItems));
      const copiedPath = findItemPath(itemsCopy, id);
      if (!copiedPath) return itemsCopy;

      const itemIndex = copiedPath[copiedPath.length - 1] as number;
      const parentItemPath = copiedPath.slice(0, -2);
      const parentItem = parentItemPath[
        parentItemPath.length - 2
      ] as ChecklistItemData;
      const parentIndex = parentItemPath[parentItemPath.length - 1] as number;

      const grandParentListPath = parentItemPath.slice(0, -2);
      let grandParentList = itemsCopy;
      if (grandParentListPath.length > 0) {
        const grandParentItem = grandParentListPath[
          grandParentListPath.length - 2
        ] as ChecklistItemData;
        grandParentList = grandParentItem.children!;
      }

      const itemToOutdent = {
        ...parentItem.children![itemIndex],
        level: parentItem.level,
      };

      const siblingsToMove = parentItem.children!.splice(itemIndex + 1);
      parentItem.children!.splice(itemIndex, 1);
      grandParentList.splice(parentIndex + 1, 0, itemToOutdent);
      itemToOutdent.children = [
        ...(itemToOutdent.children || []),
        ...siblingsToMove.map((sibling) => ({
          ...sibling,
          level: itemToOutdent.level + 1,
        })),
      ];

      const updateLevels = (items: ChecklistItemData[], baseLevel: number) => {
        items.forEach((item) => {
          item.level = baseLevel + 1;
          if (item.children && item.children.length > 0) {
            updateLevels(item.children, item.level);
          }
        });
      };
      if (itemToOutdent.children) {
        updateLevels(itemToOutdent.children, itemToOutdent.level);
      }

      return itemsCopy;
    });
  };

  const handleEnterKeyPress = (currentItemId: string) => {
    setChecklistItems((prevItems) => {
      const path = findItemPath(prevItems, currentItemId);
      if (!path) return prevItems;

      const currentItemLevel = (path[path.length - 2] as ChecklistItemData)
        .level;
      const newItem: ChecklistItemData = {
        id: uuidv4(),
        text: "",
        completed: false,
        level: currentItemLevel,
        children: [],
      };

      const itemsCopy = JSON.parse(JSON.stringify(prevItems));
      const copiedPath = findItemPath(itemsCopy, currentItemId);
      if (!copiedPath) return itemsCopy;

      const itemIndex = copiedPath[copiedPath.length - 1] as number;
      const parentListPath = copiedPath.slice(0, -2);
      let parentList = itemsCopy;

      if (parentListPath.length > 0) {
        const parentItem = parentListPath[
          parentListPath.length - 2
        ] as ChecklistItemData;
        parentList = parentItem.children!;
      }

      parentList.splice(itemIndex + 1, 0, newItem);

      requestAnimationFrame(() => {
        itemRefs.current[newItem.id]?.focusItem();
      });

      return itemsCopy;
    });
  };

  const onSave = () => {
    handleSaveRoutine(checklistItems);
  };

  const flatChecklistItems = React.useMemo(
    () => flattenChecklist(checklistItems),
    [checklistItems]
  );

  React.useEffect(() => {
    const currentIds = new Set(flatChecklistItems.map((item) => item.id));
    Object.keys(itemRefs.current).forEach((id) => {
      if (!currentIds.has(id)) {
        delete itemRefs.current[id];
      }
    });
  }, [flatChecklistItems]);

  return (
    <Card className="w-full max-w-md bg-secondary/95 border-primary/20">
      {" "}
      {/* Use theme colors */}
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary mb-4">
          {" "}
          {/* Use primary */}
          {editingRoutine ? "Edit Routine" : "Add Routine"}
        </h3>

        <div className="space-y-4">
          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <span className="text-primary">Name:</span> {/* Use primary */}
            <Input
              value={routineText}
              onChange={(e) => {
                setError(null);
                setRoutineText(e.target.value);
              }}
              className="bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30" // Use theme colors
            />
          </div>

          {/* Repeat Every Section */}
          <div className="flex flex-col gap-2">
            <span className="text-primary">Repeat Every:</span>{" "}
            {/* Use primary */}
            <div className="flex items-center gap-2 p-2 rounded border border-primary/20 bg-secondary/60 justify-center">
              {" "}
              {/* Use theme colors */}
              <NumberWheelPicker
                label="Value"
                value={routineConfig.value}
                onChange={(value) => handleConfigChange("value", value)}
                min={1}
                max={30}
              />
              <PeriodWheelPicker
                value={routineConfig.period}
                onChange={(value) => handleConfigChange("period", value)}
              />
            </div>
          </div>

          {/* Checklist Section */}
          <div className="flex flex-col gap-2">
            <span className="text-primary">Checklist:</span> {/* Use primary */}
            {/* Input for adding new items */}
            <div className="flex gap-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add checklist item..."
                className="flex-grow bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30" // Use theme colors
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.ctrlKey &&
                    !e.metaKey
                  ) {
                    // Ensure only Enter adds item
                    e.preventDefault(); // Prevent potential form submission or newline in input
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button
                onClick={handleAddChecklistItem}
                size="icon"
                variant="ghost"
                className="text-primary hover:bg-primary/20" // Use primary
              >
                <Plus size={18} />
              </Button>
            </div>
            <Reorder.Group
              axis="y"
              values={flatChecklistItems}
              onReorder={handleReorderChecklist}
              className="space-y-1 mt-2 max-h-60 overflow-y-auto pr-2"
            >
              {flatChecklistItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  item={item}
                  onUpdate={handleUpdateChecklistItem}
                  onDelete={handleDeleteChecklistItem}
                  onIndent={handleIndentChecklistItem}
                  onOutdent={handleOutdentChecklistItem}
                  onEnter={handleEnterKeyPress}
                  dragControls={dragControls}
                />
              ))}
            </Reorder.Group>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Checkbox
              id="good-routine-checkbox"
              checked={routineConfig.isGoodRoutine}
              onCheckedChange={(checked) =>
                handleConfigChange("isGoodRoutine", checked as boolean)
              }
              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Use primary
            />
            <label htmlFor="good-routine-checkbox" className="text-primary">
              {" "}
              {/* Use primary */}
              Good routine
            </label>
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
            onClick={onSave}
            className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50" // Use theme colors
          >
            {editingRoutine ? "Save Changes" : "Add Routine"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoutineForm;
