"use client";

import React, { useState } from "react";
import Image from "next/image";
import ChatPopup from "@/components/chat/ChatPopup";
import useDashboardStore from "@/store/dashboardStore";

interface ChatContainerProps {
  onRefreshNeeded: () => void;
}

export default function ChatContainer({ onRefreshNeeded }: ChatContainerProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const player = useDashboardStore((state) => state.player);
  const currentTheme = useDashboardStore((state) => state.currentTheme);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      {!isChatOpen && player?.mentor && (
        <div
          onClick={openChat}
          className="fixed bottom-4 right-4 z-50 cursor-pointer rounded-full shadow-lg transition-transform duration-200 ease-in-out hover:scale-110"
          role="button"
          aria-label="Open Chat"
          style={
            {
              "--tw-ring-color": currentTheme.primary.DEFAULT,
            } as React.CSSProperties
          }
        >
          <Image
            src={`/${player.mentor}.png`}
            alt="Chat Mentor"
            width={86}
            height={86}
            priority
          />
        </div>
      )}
      <ChatPopup
        isOpen={isChatOpen}
        onClose={closeChat}
        onRefreshNeeded={onRefreshNeeded}
      />
    </>
  );
}
