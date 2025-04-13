"use client";

"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
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

interface NeuralVaultPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VaultData {
  fileName: string;
  content: string;
}

const NeuralVaultPopup: React.FC<NeuralVaultPopupProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !vaultData && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/players/neural-vault`;
          const response = await fetch(apiUrl);

          if (!response.ok) {
            let errorText = `HTTP error! status: ${response.status}`;
            try {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorText = errorData.error || JSON.stringify(errorData);
              } else {
                errorText = await response.text();
              }
            } catch (parseError) {
              errorText = `Failed to parse error response: ${response.statusText}`;
            }
            throw new Error(errorText);
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(
              `Expected JSON response but received ${contentType || "unknown"}`
            );
          }

          let data: VaultData = await response.json();

          const githubRawUrlBase =
            "https://raw.githubusercontent.com/yashaggarwal85d/Neural-Vault/main/zassets/";
          data.content = data.content.replace(
            /!\[\[([^\]]+)\]\]/g,
            (match, filename) => {
              const trimmedFilename = filename.trim();

              const encodedFilename = encodeURIComponent(trimmedFilename);
              return `![](${githubRawUrlBase}${encodedFilename})`;
            }
          );

          setVaultData(data);
        } catch (err) {
          console.error("Failed to fetch from Neural Vault API:", err);
          const message =
            err instanceof Error
              ? err.message
              : "An unknown error occurred while fetching data.";
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }

    if (!isOpen) {
      setVaultData(null);
      setError(null);
    }
  }, [isOpen, vaultData, isLoading]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[60vw] max-h-[80vh] flex flex-col bg-gradient-to-br from-background via-primary/10 to-background border-primary/50 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Neural Vault Entry: {vaultData?.fileName || "Loading..."}
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
                  img: ({ node, src, alt, title, ...props }) => {
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

export default NeuralVaultPopup;
