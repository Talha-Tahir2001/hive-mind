"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden text-foreground [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_code]:text-xs [&_p]:text-sm [&_ul]:text-sm [&_ol]:text-sm [&_li]:text-sm [&_strong]:text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}