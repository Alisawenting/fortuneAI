import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, Sparkles, Loader2, BookOpen, Star, Compass, Eye, Target } from "lucide-react";
import { useState, useEffect } from "react";
import type { ZiweiChartData, ZiweiPalace } from "@/lib/ziwei/types";
import { generateZiweiReport, chartToTextSummary, type ZiweiReportResult } from "@/lib/ziwei/ziwei-report.functions";
import { MarkdownText } from "@/lib/utils";

export const Route = createFileRoute("/ziwei-chart")({
  head: () => ({
    meta: [
      { title: "紫微命盘 · 云枢易馆" },
      { name: "description", content: "紫微斗数十二宫命盘，AI 智解主星、四化、格局。" },
    ],
  }),
  component: ZiweiChartPage,
});

// 地支 → 12宫网格位置 (4×4, row/col)
const GRID_POS: Record<string, [number, number]> = {
  "巳": [0, 0], "午": [0, 1], "未": [0, 2], "申": [0, 3],
  "辰": [1, 0], "酉": [1, 3],
  "卯": [2, 0], "戌": [2, 3],
  "寅": [3, 0], "丑": [3, 1], "子": [3, 2], "亥": [3, 3],
};

// 主星 → 五行色
function starColor(name: string): string {
  const c: Record<string, string> = {
    "紫微": "#c084fc", "天机": "#7bc47f", "太阳": "#f59e0b", "武曲": "#94a3b8",
    "天同": "#6a9ed9", "廉贞": "#d94e3c", "天府": "#c49a3c", "太阴": "#5a8ec9",
    "贪狼": "#4a9e6e", "巨门": "#78716c", "天相": "#a78bfa", "天梁": "#22c55e",
    "七杀": "#ef4444", "破军": "#f97316",
  };
  return c[name] || "#94a3b8";
}

function ZiweiChartPage() {
  const locationState = useRouterState({ select: (s) => s.location.state }) as
    | { chartData?: ZiweiChartData; formData?: { gender: string; birthDate: string; birthTime: string; calendar: string } }
    | undefined;

  // 从 router state 或 localStorage 恢复
  const [chartData, setChartData] = useState<ZiweiChartData | null>(() => {
    if (locationState?.chartData) return locationState.chartData;
    try {
      const c = localStorage.getItem("yunshu:last-ziwei");
      return c ? JSON.parse(c) : null;
    } catch { return null; }
  });

  const [report, setReport] = useState<ZiweiReportResult | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);

  // 缓存 chartData
  useEffect(() => {
    if (locationState?.chartData) {
      setChartData(locationState.chartData);
      try { localStorage.setItem("yunshu:last-ziwei", JSON.stringify(locationState.chartData)); } catch { /* */ }
    }
  }, [locationState?.chartData]);

  // AI 报告
  useEffect(() => {
    if (!chartData || report) return;
    const cacheKey = "yunshu:ziwei-report";
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const p = JSON.parse(cached);
        if (p.overview && p.minggongAnalysis) { setReport(p); return; }
      }
    } catch { /* */ }

    setReportLoading(true);
    setReportError(false);
    const summary = chartToTextSummary(chartData, "用户");

    generateZiweiReport({ data: { name: "用户", gender: chartData.gender, chartSummary: summary } })
      .then((r) => {
        if (r.success) {
          setReport(r.report);
          try { localStorage.setItem(cacheKey, JSON.stringify(r.report)); } catch { /* */ }
        } else setReportError(true);
      })
      .catch(() => setReportError(true))
      .finally(() => setReportLoading(false));
  }, [chartData]);

  if (!chartData) {
    return (
      <MobileShell>
        <header className="flex items-center justify-between px-5 pt-10">
          <Link to="/divine" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="font-serif-cn text-base font-medium">紫微命盘</p>
          <span className="w-9" />
        </header>
        <div className="flex flex-col items-center justify-center px-5 pt-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Compass className="h-8 w-8" />
          </div>
          <p className="mt-5 font-serif-cn text-lg">尚未排盘</p>
          <p className="mt-2 text-sm text-muted-foreground">请先录入生辰信息，生成紫微斗数命盘</p>
          <Link to="/divine" className="mt-6 rounded-2xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-floating">
            开始测算 →
          </Link>
        </div>
      </MobileShell>
    );
  }

  // 构建4×4网格
  const grid: (ZiweiPalace | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (const p of chartData.palaces) {
    const pos = GRID_POS[p.earthlyBranch];
    if (pos) grid[pos[0]][pos[1]] = p;
  }

  const minggong = chartData.palaces.find((p) => p.name === "命宫");

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <Link to="/divine" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">紫微斗数 · 命盘</p>
        <div className="w-9" />
      </header>

      <div className="px-5 pt-5 pb-8">
        {/* 命盘头部信息 */}
        <div className="scroll-paper rounded-3xl p-5 shadow-soft mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif-cn text-lg">
                {chartData.gender === "男" ? "乾造" : "坤造"} · {minggong?.name || ""}
                {minggong?.majorStars[0] ? ` · ${minggong.majorStars[0]}坐命` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                公历 {chartData.solarDate} · 农历 {chartData.lunarDate}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {chartData.time} · 生肖{chartData.zodiac} · {chartData.sign} · {chartData.fiveElementsClass}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">命主: <span className="text-primary">{chartData.soul}</span></p>
              <p className="text-[11px] text-muted-foreground">身主: <span className="text-primary">{chartData.body}</span></p>
              <p className="text-[11px] text-muted-foreground">命宫: <span className="text-primary">{chartData.soulPalace}</span></p>
            </div>
          </div>
        </div>

        {/* 12宫网格 */}
        <div className="rounded-3xl bg-card p-3 shadow-soft mb-5">
          <p className="px-2 py-1 font-serif-cn text-sm font-medium text-center">十二宫命盘</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => {
                const palace = grid[row][col];
                if (!palace) {
                  // 中间空位
                  if ((row === 1 && col === 1) || (row === 1 && col === 2) ||
                      (row === 2 && col === 1) || (row === 2 && col === 2)) {
                    return (
                      <div key={`empty-${row}-${col}`} className="flex items-center justify-center rounded-xl">
                        {row === 1 && col === 2 && (
                          <div className="text-center">
                            <Compass className="h-6 w-6 mx-auto text-primary/40" />
                            <p className="text-[9px] text-muted-foreground/40 mt-1">紫微斗数</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return <div key={`empty-${row}-${col}`} className="rounded-xl bg-muted/20" />;
                }

                const isBody = palace.isBodyPalace;
                const isOriginal = palace.isOriginalPalace;
                const isMinggong = palace.name === "命宫";

                return (
                  <div
                    key={palace.earthlyBranch}
                    className={`rounded-xl border p-2 relative ${
                      isMinggong ? "border-primary/60 bg-primary/5" :
                      isBody ? "border-accent/60 bg-accent/5" :
                      "border-border/60 bg-card"
                    }`}
                  >
                    {/* 宫位名称 + 天干地支 */}
                    <div className="flex items-center justify-between">
                      <p className={`text-[11px] font-medium ${isMinggong ? "text-primary" : "text-foreground"}`}>
                        {palace.name}
                      </p>
                      <span className="text-[9px] text-muted-foreground">
                        {palace.heavenlyStem}{palace.earthlyBranch}
                      </span>
                    </div>

                    {/* 主星 — 五行色 */}
                    <div className="mt-1 space-y-0.5">
                      {palace.majorStars.length > 0 ? (
                        palace.majorStars.slice(0, 3).map((s) => (
                          <p
                            key={s}
                            className="text-[10px] leading-tight font-medium"
                            style={{ color: starColor(s) }}
                          >
                            {s}
                          </p>
                        ))
                      ) : (
                        <p className="text-[10px] leading-tight text-muted-foreground/50 italic">空宫</p>
                      )}
                    </div>

                    {/* 辅星 */}
                    {palace.minorStars.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {palace.minorStars.slice(0, 4).map((s) => (
                          <span key={s} className="text-[8px] text-muted-foreground/70">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* 大限 + 小限 */}
                    <div className="mt-1.5 pt-1 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[8px] text-muted-foreground">
                        {palace.decadalRange[0]}-{palace.decadalRange[1]}岁
                      </span>
                      {palace.changsheng12 && (
                        <span className="text-[8px] text-primary/70">{palace.changsheng12}</span>
                      )}
                    </div>

                    {/* 标签 */}
                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                      {isMinggong && (
                        <span className="rounded-full bg-primary px-1 py-0.5 text-[8px] text-primary-foreground">命</span>
                      )}
                      {isBody && (
                        <span className="rounded-full bg-accent px-1 py-0.5 text-[8px] text-accent-foreground">身</span>
                      )}
                      {isOriginal && (
                        <span className="rounded-full bg-[var(--cinnabar)] px-1 py-0.5 text-[8px] text-white">因</span>
                      )}
                    </div>
                  </div>
                );
              }),
            )}
          </div>

          {/* 图例 */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> 命宫</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> 身宫</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--cinnabar)]" /> 来因宫</span>
            <span>大限·长生</span>
          </div>
        </div>

        {/* 四化速览 */}
        <section className="rounded-3xl bg-card p-5 shadow-soft mb-5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="font-serif-cn text-sm font-medium">四化飞星</p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {["化禄", "化权", "化科", "化忌"].map((m, i) => {
              const colors = ["#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"];
              return (
                <div key={m} className="rounded-xl bg-muted/40 py-2">
                  <p className="text-[10px] text-muted-foreground">{m}</p>
                  <p className="font-serif-cn text-sm" style={{ color: colors[i] }}>
                    {chartData.palaces.find((p) =>
                      p.majorStars.some((s) => s.includes(m.replace("化", "")))
                    )?.name || "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI 解读报告 */}
        <section className="rounded-3xl bg-card p-5 shadow-soft mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-serif-cn text-sm font-medium">AI 紫微斗数深度分析</p>
          </div>

          {reportLoading && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="font-serif-cn text-sm text-muted-foreground">枢机正在解读你的紫微命盘...</p>
            </div>
          )}

          {report && !reportLoading && (
            <div className="mt-3 space-y-3">
              {[
                { key: "overview", icon: BookOpen, title: "命盘总览", content: report.overview, color: "text-primary bg-primary/10" },
                { key: "minggongAnalysis", icon: Star, title: "命宫解读", content: report.minggongAnalysis, color: "text-[var(--cinnabar)] bg-cinnabar/[0.12]" },
                { key: "shenggongAnalysis", icon: Eye, title: "身宫与后天", content: report.shenggongAnalysis, color: "text-[var(--gold)] bg-gold/[0.12]" },
                { key: "sixiang", icon: Compass, title: "四化点睛", content: report.sixiang, color: "text-accent bg-accent/10" },
                { key: "pattern", icon: Target, title: "格局初探", content: report.pattern, color: "text-[var(--jade)] bg-jade/[0.12]" },
                { key: "lifeAdvice", icon: Sparkles, title: "人生锦囊", content: report.lifeAdvice, color: "text-primary bg-primary/10" },
              ].filter((s) => s.content).map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className="rounded-2xl border border-border/60 p-4 bg-gradient-to-br from-card to-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="font-serif-cn text-sm font-medium">{s.title}</p>
                    </div>
                    <p className="text-[13px] leading-6 text-foreground/85 whitespace-pre-line">
                      <MarkdownText text={s.content} />
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {reportError && !reportLoading && !report && (
            <p className="mt-4 text-center text-xs text-muted-foreground py-6">AI 分析暂不可用，请稍后重试</p>
          )}
        </section>

        {/* 回退链接 */}
        <Link
          to="/divine"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-floating"
        >
          重新排盘 →
        </Link>
      </div>
    </MobileShell>
  );
}
