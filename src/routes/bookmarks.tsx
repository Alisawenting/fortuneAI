import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, Bookmark, BookmarkX, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import {
  yearlyPrompts,
  readBookmarks,
  toggleBookmark,
  type YearlyPrompt,
} from "@/lib/yearlyPrompts";
import { toast } from "sonner";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "已收藏流年 · 云枢易馆" },
      { name: "description", content: "查看你已收藏的流年提示。" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readBookmarks());
    const handler = () => setIds(readBookmarks());
    window.addEventListener("yunshu:bookmarks-change", handler);
    return () => window.removeEventListener("yunshu:bookmarks-change", handler);
  }, []);

  const items: YearlyPrompt[] = yearlyPrompts.filter((p) => ids.includes(p.id));

  const remove = (p: YearlyPrompt) => {
    toggleBookmark(p.id);
    toast("已取消收藏", { description: p.title });
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">已收藏流年</p>
        <span className="w-9" />
      </header>

      <div className="px-5 pt-5 pb-6">
        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-soft">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 font-serif-cn text-base">尚未收藏流年提示</p>
            <p className="mt-1 text-xs text-muted-foreground">
              在首页轻点收藏按钮，可随时回到此处查阅
            </p>
            <Link
              to="/"
              className="mt-5 rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground shadow-soft"
            >
              回到首页
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl bg-card p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      p.tone === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-serif-cn text-sm">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(p)}
                    aria-label="取消收藏"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--cinnabar)] hover:bg-muted/60"
                  >
                    <BookmarkX className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link
                    to="/reading"
                    className="text-xs text-primary"
                  >
                    查看完整解读 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
