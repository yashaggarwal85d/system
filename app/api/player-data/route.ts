import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: true, // Include player data
        tasks: {
          // Include tasks (todos and habits)
          orderBy: {
            // Optional: Add default sorting if needed
            createdAt: "desc",
          },
        },
        routines: {
          // Include routines
          include: {
            checklist: {
              // Include checklist items within routines
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        // Exclude sensitive fields like password hash if necessary
        // select: { id: true, username: true, player: true, tasks: true, routines: true }
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // We might want to process the tasks/routines here to reset completion status
    // based on nextDue, similar to how the individual GET routes do,
    // ensuring consistency regardless of how data is fetched.
    const now = new Date();

    const processedTasks = userData.tasks.map((task) => {
      if (
        task.category === "habit" &&
        task.completed &&
        task.nextDue &&
        new Date(task.nextDue) < now
      ) {
        return { ...task, completed: false };
      }
      return task;
    });

    const processedRoutines = userData.routines.map((routine) => {
      if (
        routine.completed &&
        routine.nextDue &&
        new Date(routine.nextDue) < now
      ) {
        return { ...routine, completed: false };
      }
      return routine;
    });

    // Return the combined data, excluding the password
    const { password, ...userWithoutPassword } = userData;
    const responseData = {
      ...userWithoutPassword,
      tasks: processedTasks,
      routines: processedRoutines,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching player data:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}
