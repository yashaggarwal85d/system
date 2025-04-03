import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import prisma from "@/lib/prisma";
import { Task } from "@prisma/client";
import { HabitConfig } from "@/lib/interfaces/habit"; // For validation
import { calculateNextDueDate } from "@/lib/utils"; // For nextDue calculation

interface Params {
  id: string;
}

// PUT /api/habits/[id] - Update a specific habit
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const habitId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { title, frequency } = body; // Expect title and optional frequency config
    const config = frequency as HabitConfig | undefined;

    // --- Validation ---
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (config) {
      // Validate config only if provided
      if (
        typeof config !== "object" ||
        typeof config.count !== "number" ||
        config.count < 1 ||
        typeof config.period !== "string" ||
        !["days", "weeks", "months"].includes(config.period) ||
        typeof config.value !== "number" ||
        config.value < 1 ||
        typeof config.time !== "string" ||
        !/^\d{2}:\d{2}$/.test(config.time) ||
        typeof config.isGoodHabit !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid habit frequency configuration" },
          { status: 400 }
        );
      }
    }
    // --- End Validation ---

    // Check ownership
    const existingHabit = await prisma.task.findUnique({
      where: { id: habitId },
    });
    if (!existingHabit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    if (existingHabit.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingHabit.category !== "habit") {
      return NextResponse.json(
        { error: "Cannot update non-habit task via this endpoint" },
        { status: 400 }
      );
    }

    // Prepare update data precisely for Prisma
    const updateData: {
      title: string;
      frequency?: HabitConfig; // Prisma expects JsonValue, HabitConfig should be compatible if JSON serializable
      isGoodHabit?: boolean;
      originalTime?: string;
      nextDue?: Date | null;
    } = { title };
    if (config) {
      updateData.frequency = config; // Assuming HabitConfig is stored as JSON
      updateData.isGoodHabit = config.isGoodHabit;
      updateData.originalTime = config.time;
      // Recalculate nextDue based on new frequency and *now*
      updateData.nextDue = calculateNextDueDate(new Date(), config) ?? null; // Ensure null if undefined
    }

    const updatedHabit = await prisma.task.update({
      where: { id: habitId },
      data: updateData,
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error(`Error updating habit ${habitId}:`, error);
    return NextResponse.json(
      { error: "Failed to update habit" },
      { status: 500 }
    );
  }
}

// PATCH /api/habits/[id] - Toggle completion status for the current period
export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const habitId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Check ownership
    const existingHabit = await prisma.task.findUnique({
      where: { id: habitId },
    });
    if (!existingHabit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    if (existingHabit.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingHabit.category !== "habit" || !existingHabit.frequency) {
      return NextResponse.json(
        { error: "Invalid task type for habit toggle" },
        { status: 400 }
      );
    }

    const newCompletedStatus = !existingHabit.completed;
    let nextDueDate = existingHabit.nextDue;
    let lastCompletedDate = existingHabit.lastCompleted;

    if (newCompletedStatus) {
      // Completing the habit
      lastCompletedDate = new Date();
      nextDueDate =
        calculateNextDueDate(
          new Date(),
          existingHabit.frequency as HabitConfig
        ) ?? null; // Ensure null if undefined
    } else {
      // Un-completing - revert lastCompleted and recalculate nextDue based on 'now'
      lastCompletedDate = null; // Or keep previous value if needed? Setting to null is simpler.
      nextDueDate =
        calculateNextDueDate(
          new Date(),
          existingHabit.frequency as HabitConfig
        ) ?? null; // Ensure null if undefined
    }

    // TODO: Calculate actual aura change based on player stats, habit type etc.
    const isGood = existingHabit.isGoodHabit ?? false;
    const simulatedAuraChange = newCompletedStatus
      ? isGood
        ? 15
        : -15
      : isGood
      ? -15
      : 15;

    const updatedHabit = await prisma.task.update({
      where: { id: habitId },
      data: {
        completed: newCompletedStatus,
        lastCompleted: lastCompletedDate, // Already Date | null
        nextDue: nextDueDate ?? null, // Ensure null if undefined
      },
    });

    return NextResponse.json({
      completed: updatedHabit.completed,
      auraChange: simulatedAuraChange, // Send back simulated aura change
      nextDue: updatedHabit.nextDue, // Send back the calculated next due date
    });
  } catch (error) {
    console.error(`Error toggling habit ${habitId}:`, error);
    return NextResponse.json(
      { error: "Failed to toggle habit" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - Delete a specific habit
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const habitId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Check ownership
    const existingHabit = await prisma.task.findUnique({
      where: { id: habitId },
    });
    if (!existingHabit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    if (existingHabit.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingHabit.category !== "habit") {
      return NextResponse.json(
        { error: "Cannot delete non-habit task via this endpoint" },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id: habitId },
    });

    return NextResponse.json(
      { message: "Habit deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting habit ${habitId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
  }
}
