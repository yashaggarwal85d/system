"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/dialog";
import { ScrollArea } from "@/components/common/scroll-area";
import { VaultData } from "@/lib/utils/interfaces";
import { fetchNotesData } from "@/lib/utils/apiUtils";
import useDashboardStore from "@/store/dashboardStore";

interface NotesPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotesPopup: React.FC<NotesPopupProps> = ({ isOpen, onOpenChange }) => {
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const isFetching = useRef(false);
  const player = useDashboardStore((state) => state.player);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchNotesData();
        if (isMounted) {
          setVaultData(data);
          setError(null);
          setIsPopupVisible(true);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching data.";
        if (isMounted) {
          setError(message);
          setVaultData(null);
          setIsPopupVisible(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isFetching.current = false;
      }
    };

    if (isOpen) {
      if (player) {
        if (!player.obsidian_notes) {
          toast.info("Obsidian notes path not set.", {
            description: "We recommend setting it up for insights.",
            duration: 5000,
          });

          if (isPopupVisible) setIsPopupVisible(false);
          if (isLoading) setIsLoading(false);
          if (error) setError(null);
          if (vaultData) setVaultData(null);
          if (isFetching.current) isFetching.current = false;
          onOpenChange(false);
        } else {
          if (!isFetching.current && !vaultData && !error) {
            fetchData();
          } else if (
            (vaultData || error) &&
            !isPopupVisible &&
            !isFetching.current
          ) {
            setIsPopupVisible(true);
          }
        }
      } else if (
        (vaultData || error) &&
        !isPopupVisible &&
        !isFetching.current
      ) {
        setIsPopupVisible(true);
      }
    } else {
      if (isPopupVisible) {
        setIsPopupVisible(false);
      }

      if (!isFetching.current) {
        setVaultData(null);
        setError(null);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, player, vaultData, error, isPopupVisible]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsPopupVisible(false);
      onOpenChange(false);

      setVaultData(null);
      setError(null);
    }
  };

  return (
    <Dialog open={isPopupVisible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[60vw] max-h-[80vh] flex flex-col bg-gradient-to-br from-background via-primary/10 to-background border-primary/50 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {vaultData?.fileName || "Loading..."}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            A random insight from the knowledge vault.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="my-4 pr-4 h-[calc(80vh-8rem)] overflow-y-auto">
          {" "}
          {isLoading && (
            <p className="text-center text-primary/80">Loading content...</p>
          )}
          {error && (
            <p className="text-center text-destructive">Error: {error}</p>
          )}
          {vaultData && !isLoading && !error && (
            <div className="markdown-content text-foreground/90">
              {" "}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ node, src, alt, title }) => {
                    if (alt === "Video" && src) {
                      return (
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="markdown-content-link text-primary hover:underline"
                          title={title}
                        >
                          Video Link 🎬 {}
                        </a>
                      );
                    }

                    return <img src={src} alt={alt} title={title} />;
                  },

                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        wrapLongLines={true}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {vaultData.content}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NotesPopup;
