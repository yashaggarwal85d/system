"use client";

"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import remarkBreaks from "remark-breaks"; // Removed remark-breaks
import rehypeRaw from "rehype-raw"; // Import rehype-raw
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"; // Choose a theme
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import { Button } from "@/components/common/button";
import { ScrollArea } from "@/components/common/scroll-area"; // For scrollable content

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
    // Fetch data only when the dialog is opened
    if (isOpen && !vaultData && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/neural-vault");
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `HTTP error! status: ${response.status}`
            );
          }
          let data: VaultData = await response.json();

          // Preprocess content to replace Obsidian image links with GitHub raw URLs
          const githubRawUrlBase =
            "https://raw.githubusercontent.com/yashaggarwal85d/Neural-Vault/main/zassets/";
          data.content = data.content.replace(
            /!\[\[([^\]]+)\]\]/g,
            (match, filename) => {
              // Trim whitespace from filename just in case
              const trimmedFilename = filename.trim();
              // Encode the filename part of the URL
              const encodedFilename = encodeURIComponent(trimmedFilename);
              return `![](${githubRawUrlBase}${encodedFilename})`; // Standard Markdown image link
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
    // Reset data if dialog is closed, so it fetches fresh data next time
    if (!isOpen) {
      setVaultData(null);
      setError(null);
    }
  }, [isOpen, vaultData, isLoading]); // Rerun effect if isOpen changes

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[60vw] max-h-[80vh] flex flex-col bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 border-purple-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-purple-400">
            Neural Vault Entry: {vaultData?.fileName || "Loading..."}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            A random insight from the knowledge vault.
          </DialogDescription>
        </DialogHeader>
        {/* Apply explicit calculated height and force overflow */}
        <ScrollArea className="my-4 pr-4 h-[calc(80vh-8rem)] overflow-y-auto">
          {" "}
          {/* Added overflow-y-auto */}
          {isLoading && (
            <p className="text-center text-purple-300">Loading content...</p>
          )}
          {error && <p className="text-center text-red-400">Error: {error}</p>}
          {vaultData && !isLoading && !error && (
            <div className="markdown-content text-gray-300">
              {" "}
              {/* Added markdown-content class */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Removed remarkBreaks
                rehypePlugins={[rehypeRaw]} // Add rehypeRaw to allow HTML like <mark>
                components={{
                  // Custom renderer for images
                  img: ({ node, src, alt, title, ...props }) => {
                    // Destructure title here
                    if (alt === "Video" && src) {
                      // If alt text is "Video", render as a link
                      return (
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="markdown-content-link text-purple-400 hover:underline" // Added basic link styling
                          title={title} // Pass title if it exists
                        >
                          Video Link 🎬 {/* Or simply use alt: {alt} */}
                        </a>
                      );
                    }
                    // Otherwise, render as a normal image (handles GitHub images)
                    // Pass only relevant/safe props to img
                    return <img src={src} alt={alt} title={title} />;
                  },
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  code({ node, className, children, ...props }) {
                    // Destructure node but don't use it in spread
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        // Pass only relevant props, excluding potential conflicts like 'node' or invalid HTML attrs
                        style={vscDarkPlus} // Apply the theme
                        language={match[1]}
                        PreTag="div"
                        wrapLongLines={true} // Optional: wrap long lines
                        // {...props} // Avoid spreading unknown props
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      // For inline code, pass className and other props might be relevant
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Optional: Add custom styling for <mark> if needed beyond browser default
                  // mark: ({children}) => <mark style={{ backgroundColor: '#FFB86CA6', padding: '0.1em 0.3em', borderRadius: '3px' }}>{children}</mark>
                }}
              >
                {vaultData.content}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
        {/* DialogFooter removed */}
      </DialogContent>
    </Dialog>
  );
};

export default NeuralVaultPopup;
