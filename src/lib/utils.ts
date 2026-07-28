import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 简易 Markdown 渲染：**加粗**、换行、*斜体*
function renderMarkdownNodes(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split(/\n/);
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const children = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return React.createElement("strong", { key: `${li}-${pi}`, className: "font-semibold text-foreground" }, part.slice(2, -2));
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return React.createElement("em", { key: `${li}-${pi}` }, part.slice(1, -1));
      }
      return part;
    });
    const hasMore = li < lines.length - 1;
    return React.createElement(React.Fragment, { key: li }, [...children, hasMore ? React.createElement("br", { key: `br-${li}` }) : null]);
  });
}

// 便捷组件：渲染带 **加粗** 的文本
export function MarkdownText({ text, className }: { text: string; className?: string }) {
  return React.createElement("span", { className }, renderMarkdownNodes(text));
}

