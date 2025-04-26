"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  mentor_name?: string;
}

interface ChatViewProps {
  onRefreshNeeded: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onRefreshNeeded }) => {
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
    text: `Hello! I'm ${
      player?.mentor || "your mentor"
    }. Ask me anything about your tasks, habits, or routines. You can also ask me to create or edit them.`,
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
      setIsHistoryLoading(true);

      setNewMessage("");
      try {
        console.log("Fetching chat history...");
        const historyData: ChatHistoryEntry[] = await fetchChatHistoryAPI();
        const formattedMessages: Message[] = historyData.map(
          (entry, index) => ({
            id: `hist-${index}-${entry.timestamp}`,
            role: entry.role === "assistant" ? "model" : "user",
            text: entry.content,
            mentor_name: entry.mentor,
            timestamp: new Date(entry.timestamp),
          })
        );

        setMessages([greetingMessage, ...formattedMessages]);
        console.log("Chat history fetched successfully.");
      } catch (error) {
        console.error("Failed to fetch chat history:", error);

        setMessages([greetingMessage]);
        toast({
          title: "Error",
          description: "Could not load previous chat history.",
          variant: "destructive",
        });
      } finally {
        setIsHistoryLoading(false);

        inputRef.current?.focus();
      }
    };

    if (player?.mentor) {
      loadHistory();
    }
  }, [player?.mentor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      console.log(response);
      if (response && response.reply) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: response.reply,
          timestamp: new Date(),
          mentor_name: response.mentor,
        };
        setMessages((prev) => [...prev, aiResponse]);

        if (response.action_taken) {
          console.log("AI action taken, signaling refresh needed...");
          onRefreshNeeded();
        }
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
      inputRef.current?.focus();
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

  const handleClearHistory = async () => {
    try {
      await clearChatHistoryAPI();
      setMessages([greetingMessage]);
      toast({
        title: "Success",
        description: "Chat history cleared.",
      });
      onRefreshNeeded();
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
    <div className="flex flex-col h-full w-full bg-background text-foreground border border-border rounded-lg shadow-md overflow-hidden">
      {/* Header Section */}
      <div className="p-3 border-b border-border flex justify-between items-center flex-shrink-0 bg-muted/40">
        <h2 className="text-lg font-semibold text-primary">
          Chat with {player?.mentor?.split(" ")[0] || "Mentor"}
        </h2>
        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                This action cannot be undone. This will permanently delete your
                chat history.
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
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-grow relative p-4" ref={scrollAreaRef}>
        {isHistoryLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg) => {
            const isModel = msg.role === "model";
            const showMentorInfo = isModel && msg.mentor_name;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  isModel ? "justify-start" : "justify-end"
                }`}
              >
                {/* Conditionally render mentor icon for model messages */}
                {showMentorInfo && (
                  <div className="flex-shrink-0">
                    <Image
                      src={`/${msg.mentor_name}.png`}
                      alt={msg.mentor_name || "Mentor"}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col ${
                    isModel ? "items-start" : "items-end"
                  }`}
                >
                  {showMentorInfo && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">
                      {msg.mentor_name}
                    </p>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                      isModel
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {formatMessageText(msg.text)}
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border flex-shrink-0 bg-muted/40">
        <div className="flex items-center w-full space-x-2">
          <Input
            placeholder="Send a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-background border-input focus:border-primary placeholder:text-muted-foreground/50"
            aria-label="Chat message input"
            ref={inputRef}
            disabled={isLoading}
          />
          <Button
            type="button"
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">{isLoading ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
