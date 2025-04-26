"use client";

import React from "react";
import ChatView from "@/components/chat/ChatView";
import useDashboardStore from "@/store/dashboardStore";

interface ChatContainerProps {
  onRefreshNeeded: () => void;
}

export default function ChatContainer({ onRefreshNeeded }: ChatContainerProps) {
  const player = useDashboardStore((state) => state.player);

  return (
    <div className="h-full w-full">
      {" "}
      {/* Added a container div */}
      {player?.mentor ? (
        <ChatView onRefreshNeeded={onRefreshNeeded} />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {/* Optional: Placeholder if no mentor is assigned */}
          Select a mentor to start chatting.
        </div>
      )}
    </div>
  );
}
