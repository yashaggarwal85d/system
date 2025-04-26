"use client";

import { motion } from "framer-motion";
import { Dock, DockIcon } from "@/components/common/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/common/tooltip";
import {
  ListTodo,
  Repeat,
  MessageSquare,
  Landmark,
  CalendarClock,
} from "lucide-react";
import useDashboardStore from "@/store/dashboardStore";
import ScrambledText from "./Misc/ScrambledText";
import Header from "./Misc/Header";
import TasksContainer from "./task/TasksContainer";
import HabitsContainer from "./habit/HabitsContainer";
import RoutinesContainer from "./routine/RoutinesContainer";
import ChatContainer from "./chat/ChatContainer";
import PersonalFinanceContainer from "./finance/PersonalFinanceContainer";

const Dashboard = () => {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const playerExists = useDashboardStore((state) => !!state.player);
  const fetchPlayer = useDashboardStore((state) => state.fetchPlayer);

  return (
    <div className="container mx-auto p-6 relative z-10 max-w-6xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ScrambledText />
        {playerExists && <Header />}

        <div className="w-full space-y-6">
          <div className="mt-6">
            {activeTab === "tasks" && <TasksContainer />}
            {activeTab === "habits" && <HabitsContainer />}
            {activeTab === "routines" && <RoutinesContainer />}
            {activeTab === "chat" && (
              <ChatContainer onRefreshNeeded={fetchPlayer} />
            )}
            {activeTab === "finance" && <PersonalFinanceContainer />}{" "}
          </div>

          <TooltipProvider>
            <Dock className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 border border-primary/20 bg-muted">
              <Tooltip>
                <TooltipTrigger asChild>
                  <DockIcon
                    onClick={() => setActiveTab("tasks")}
                    className={
                      activeTab === "tasks"
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10"
                    }
                  >
                    <ListTodo className="h-5 w-5" />
                  </DockIcon>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tasks</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DockIcon
                    onClick={() => setActiveTab("habits")}
                    className={
                      activeTab === "habits"
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10"
                    }
                  >
                    <Repeat className="h-5 w-5" />
                  </DockIcon>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Habits</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DockIcon
                    onClick={() => setActiveTab("routines")}
                    className={
                      activeTab === "routines"
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10"
                    }
                  >
                    <CalendarClock className="h-5 w-5" />{" "}
                    {/* Changed icon to CalendarClock */}
                  </DockIcon>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Routines</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DockIcon
                    onClick={() => setActiveTab("chat")}
                    className={
                      activeTab === "chat"
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10"
                    }
                  >
                    <MessageSquare className="h-5 w-5" />
                  </DockIcon>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat</p>
                </TooltipContent>
              </Tooltip>
              {/* Added Finance DockIcon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <DockIcon
                    onClick={() => setActiveTab("finance")}
                    className={
                      activeTab === "finance"
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10"
                    }
                  >
                    <Landmark className="h-5 w-5" />
                  </DockIcon>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Finance</p>
                </TooltipContent>
              </Tooltip>
            </Dock>
          </TooltipProvider>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
