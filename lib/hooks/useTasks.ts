import { useMemo } from "react";
import useTaskStore from "@/store/taskStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/utils/interfaces";
import { parseDate } from "@/lib/utils/commonUtils";

export function useTasks() {
  const {
    entities: tasks,
    isLoading,
    error,
    setError,
    updateEntity: updateTask,
    deleteEntity: deleteTask,
  } = useTaskStore();

  const { modifyAura } = useDashboardStore();

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a: Task, b: Task) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      const a_date = parseDate(a.due_date);
      const b_date = parseDate(b.due_date);
      if (isNaN(a_date.getTime())) return 1;
      if (isNaN(b_date.getTime())) return -1;
      return a_date.getTime() - b_date.getTime();
    });
  }, [tasks]);

  const handleToggleTask = async (taskId: string | undefined) => {
    if (!taskId) {
      console.error("Task ID is undefined, cannot toggle.");
      setError("Failed to toggle task: Missing ID.");
      return;
    }
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      setError("Failed to toggle task: Task not found.");
      return;
    }

    const newCompletedState = !task.completed;
    const updatedTask = await updateTask(taskId, {
      completed: newCompletedState,
    });

    if (updatedTask) {
      if (newCompletedState) {
        modifyAura(task.aura);
      } else {
        modifyAura(-task.aura);
      }
    }
  };

  const handleDeleteTask = async (taskId: string | undefined) => {
    if (!taskId) {
      setError("Cannot delete task: Missing ID.");
      console.error("Cannot delete task without ID");
      return;
    }
    await deleteTask(taskId);
  };

  return {
    tasks: sortedTasks,
    isLoading,
    error,
    setError,

    handleToggleTask,
    handleDeleteTask,
  };
}
