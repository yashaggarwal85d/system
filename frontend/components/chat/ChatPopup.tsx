"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/dialog";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { ScrollArea } from "@/components/common/scroll-area";
import { Send, Loader2, Trash2 } from "lucide-react";
import {
  sendChatMessageAPI,
  fetchChatHistoryAPI,
  clearChatHistoryAPI,
} from "@/lib/utils/apiUtils";
import { toast } from "@/components/common/use-toast";
import { ChatHistoryEntry, Player } from "@/lib/utils/interfaces";
import useDashboardStore from "@/store/dashboardStore";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/common/tooltip";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface GeminiHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshNeeded: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({
  isOpen,
  onClose,
  onRefreshNeeded,
}) => {
  const player = useDashboardStore((state) => state.player);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greetingMessage: Message = {
    id: "init-greeting",
    role: "model",
    text: `Hello! I'm persona of ${player?.mentor}. Ask me anything about your tasks, habits, or routines. You can also ask me to create or edit them.`,
    timestamp: new Date(),
  };

  const formatMessageText = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\n|\*[^*]+\*)/g).filter(Boolean);
    return parts.map((part, index) => {
      if (part === "\n") {
        return <br key={`br-${index}`} />;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <strong key={`strong-${index}`}>{part.slice(1, -1)}</strong>;
      }
      return part;
    });
  };

  useEffect(() => {
    const loadHistory = async () => {
      const currentGreeting: Message = {
        id: "init-greeting",
        role: "model",
        text: `Hello! I'm ${
          player?.mentor || "your mentor"
        }. Ask me anything about your tasks, habits, or routines. You can also ask me to create or edit them.`,
        timestamp: new Date(),
      };

      if (isOpen) {
        setIsHistoryLoading(true);
        setMessages([currentGreeting]);
        setNewMessage("");
        try {
          console.log("Fetching chat history...");
          const historyData: ChatHistoryEntry[] = await fetchChatHistoryAPI();
          const formattedMessages: Message[] = historyData.map(
            (entry, index) => ({
              id: `hist-${index}-${entry.timestamp}`,
              role: entry.role === "assistant" ? "model" : "user",
              text: entry.content,
              timestamp: new Date(entry.timestamp),
            })
          );

          setMessages([currentGreeting, ...formattedMessages]);
          console.log("Chat history fetched successfully.");
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
          toast({
            title: "Error",
            description: "Could not load previous chat history.",
            variant: "destructive",
          });
          setMessages([currentGreeting]);
        } finally {
          setIsHistoryLoading(false);
        }
      }
    };

    loadHistory();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    try {
      const response = await sendChatMessageAPI(userMessage.text);
      if (response && response.reply) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: response.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        throw new Error("Received an empty response from the AI.");
      }
    } catch (error: any) {
      console.error("Error sending chat message:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to get response from AI.";

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);

      toast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      console.log("Chat closed. Signaling refresh needed...");
      onRefreshNeeded();
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistoryAPI();
      setMessages([greetingMessage]);
      toast({
        title: "Success",
        description: "Chat history cleared.",
      });
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      toast({
        title: "Error",
        description: "Could not clear chat history.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] h-[70vh] flex flex-col p-0 bg-secondary/60 border-primary/20"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 border-b border-primary/20 flex-shrink-0 flex flex-row justify-between items-center">
          <DialogTitle className="text-primary">
            Chat with {player?.mentor?.split(" ")[0] || "your Mentor"}
          </DialogTitle>
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary/60 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Clear Chat History</span>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear Chat History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearHistory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogHeader>
        <ScrollArea className="flex-grow relative" ref={scrollAreaRef}>
          {isHistoryLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="h-full p-4 space-y-4">
            {" "}
            {/* Removed viewportRef */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary/30 text-primary-foreground"
                      : "bg-secondary/50 text-primary"
                  }`}
                >
                  {/* Apply formatting function */}
                  <div className="text-sm">{formatMessageText(msg.text)}</div>
                  <p className="text-xs text-muted-foreground/80 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Add empty div for scroll target */}
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t border-primary/20 flex-shrink-0">
          {" "}
          <div className="flex items-center w-full space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-grow bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30"
              aria-label="Chat message input"
              ref={inputRef}
            />
            <Button
              type="button"
              size="icon"
              className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isLoading ? "Sending..." : "Send"}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatPopup;
