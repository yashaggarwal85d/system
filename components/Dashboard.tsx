"use client";

import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/common/tabs";
import { ListTodo, Repeat } from "lucide-react";
import useDashboardStore from "@/store/dashboardStore";
import ScrambledText from "./ScrambledText";
import Header from "./Header";
import TasksContainer from "./task/TasksContainer";
import HabitsContainer from "./habit/HabitsContainer";
import RoutinesContainer from "./routine/RoutinesContainer";

const Dashboard = () => {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const playerExists = useDashboardStore((state) => !!state.player);

  return (
    <div className="container mx-auto p-6 relative z-10 max-w-6xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {playerExists && <Header />}
        <ScrambledText />

        <Tabs
          value={activeTab}
          className="w-full space-y-6"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3 bg-secondary/60 border border-primary/20">
            {" "}
            {/* Use theme colors */}
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" // Use primary
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="habits"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" // Use primary
            >
              <Repeat className="h-4 w-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger
              value="routines"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" // Use primary
            >
              <ListTodo className="h-4 w-4 mr-2" /> {}
              Routines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TasksContainer />
          </TabsContent>

          <TabsContent value="habits" className="mt-6">
            <HabitsContainer />
          </TabsContent>

          <TabsContent value="routines" className="mt-6">
            <RoutinesContainer />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Dashboard;
