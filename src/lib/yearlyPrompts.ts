export type YearlyPrompt = {
  id: string;
  title: string;
  desc: string;
  tone: "primary" | "accent";
};

export const yearlyPrompts: YearlyPrompt[] = [
  {
    id: "zhengyin",
    title: "下月中旬有「正印护身」之象",
    desc: "利文书、签约、贵人提携",
    tone: "primary",
  },
  {
    id: "xiazhi",
    title: "夏至前后情绪易起伏",
    desc: "建议早睡、少做重要承诺",
    tone: "accent",
  },
  {
    id: "qiufen",
    title: "秋分后偏财有起色",
    desc: "宜复盘半年账目，择稳健品类",
    tone: "primary",
  },
];

const KEY = "yunshu:bookmarkedPrompts";

export function readBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeBookmarks(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("yunshu:bookmarks-change"));
}

export function toggleBookmark(id: string): string[] {
  const cur = readBookmarks();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  writeBookmarks(next);
  return next;
}
