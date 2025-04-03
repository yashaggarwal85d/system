import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import prisma from "@/lib/prisma";
import { Task } from "@prisma/client";

interface Params {
  id: string;
}

// Helper function to check ownership
async function checkTodoOwnership(
  userId: string,
  todoId: string
): Promise<Task | null> {
  return await prisma.task.findUnique({
    where: { id: todoId },
  });
  // Add userId check after fetching
  // if (task && task.userId !== userId) {
  //   return null; // Not authorized
  // }
  // return task;
  // Correction: Prisma can filter by userId directly
  // return await prisma.task.findUnique({
  //   where: { id: todoId, userId: userId }, // Check ownership directly
  // });
}

// PUT /api/todos/[id] - Update a specific todo
export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const todoId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { title, deadline } = body; // Allow updating title and deadline

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let deadlineDate: Date | null | undefined = undefined; // undefined means no change, null means clear
    if (deadline === null) {
      deadlineDate = null;
    } else if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline format" },
          { status: 400 }
        );
      }
    }

    // Check ownership before updating
    const existingTodo = await prisma.task.findUnique({
      where: { id: todoId },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    if (existingTodo.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingTodo.category !== "todo") {
      return NextResponse.json(
        { error: "Cannot update non-todo task via this endpoint" },
        { status: 400 }
      );
    }

    // Construct updateData precisely for Prisma update
    const updateData: { title: string; deadline?: Date | null } = { title };
    if (deadlineDate !== undefined) {
      // Only include deadline in updateData if it was provided (or explicitly set to null)
      updateData.deadline = deadlineDate;
    }

    const updatedTodo = await prisma.task.update({
      where: { id: todoId },
      data: updateData,
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error(`Error updating todo ${todoId}:`, error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// PATCH /api/todos/[id] - Toggle completion status
export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const todoId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Check ownership before toggling
    const existingTodo = await prisma.task.findUnique({
      where: { id: todoId },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    if (existingTodo.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingTodo.category !== "todo") {
      return NextResponse.json(
        { error: "Cannot toggle non-todo task via this endpoint" },
        { status: 400 }
      );
    }

    const newCompletedStatus = !existingTodo.completed;

    // TODO: Integrate Aura calculation logic here or in a service
    // For now, just toggle the status
    const updatedTodo = await prisma.task.update({
      where: { id: todoId },
      data: { completed: newCompletedStatus },
    });

    // Simulate aura change for now (backend should calculate this properly)
    const auraChange = newCompletedStatus ? 10 : -10;

    return NextResponse.json({
      completed: updatedTodo.completed,
      auraChange: auraChange, // Send back simulated aura change
    });
  } catch (error) {
    console.error(`Error toggling todo ${todoId}:`, error);
    return NextResponse.json(
      { error: "Failed to toggle todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - Delete a specific todo
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  const todoId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Check ownership before deleting
    const existingTodo = await prisma.task.findUnique({
      where: { id: todoId },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }
    if (existingTodo.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existingTodo.category !== "todo") {
      return NextResponse.json(
        { error: "Cannot delete non-todo task via this endpoint" },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id: todoId },
    });

    return NextResponse.json(
      { message: "Todo deleted successfully" },
      { status: 200 }
    ); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting todo ${todoId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
