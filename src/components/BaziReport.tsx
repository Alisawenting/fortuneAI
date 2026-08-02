import { Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Share2, Download, Sparkles, Loader2, BookOpen, User, Droplets, Calendar, Star, Compass } from "lucide-react";
import { toast } from "sonner";
import { getActiveRole } from "@/lib/roles";
import type { PaipanData } from "@/lib/api/yuanfenju.types";
import { generateBaziReport, type BaziReportResult } from "@/lib/api/bazi-report.functions";
import { MarkdownText } from "@/lib/utils";

// ==================== 天干地支五行映射 ====================

const GAN_WUXING: Record<string, { element: string; color: string }> = {
  "甲": { element: "木", color: "#4a9e6e" }, "乙": { element: "木", color: "#5db87a" },
  "丙": { element: "火", color: "#d94e3c" }, "丁": { element: "火", color: "#e8685a" },
  "戊": { element: "土", color: "#c49a3c" }, "己": { element: "土", color: "#d4a84a" },
  "庚": { element: "金", color: "#b8b8c0" }, "辛": { element: "金", color: "#c8c8d0" },
  "壬": { element: "水", color: "#5a8ec9" }, "癸": { element: "水", color: "#6a9ed9" },
};

const ZHI_WUXING: Record<string, { element: string; color: string }> = {
  "寅": { element: "木", color: "#4a9e6e" }, "卯": { element: "木", color: "#5db87a" },
  "巳": { element: "火", color: "#d94e3c" }, "午": { element: "火", color: "#e8685a" },
  "辰": { element: "土", color: "#c49a3c" }, "戌": { element: "土", color: "#c49a3c" },
  "丑": { element: "土", color: "#c49a3c" }, "未": { element: "土", color: "#c49a3c" },
  "申": { element: "金", color: "#b8b8c0" }, "酉": { element: "金", color: "#c8c8d0" },
  "亥": { element: "水", color: "#5a8ec9" }, "子": { element: "水", color: "#6a9ed9" },
};

// ==================== FullAnalysis — AI 八字分析报告 ====================

interface FullAnalysisProps {
  paipanData?: PaipanData;
}

export function FullAnalysis({ paipanData }: FullAnalysisProps) {
  const [report, setReport] = useState<BaziReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!paipanData) return;

    // 基于四柱生成唯一缓存键，确保切换角色时报告不串
    const di = paipanData.detail_info;
    const sizhuKey = di?.sizhu
      ? `${di.sizhu.year.tg}${di.sizhu.year.dz}${di.sizhu.month.tg}${di.sizhu.month.dz}${di.sizhu.day.tg}${di.sizhu.day.dz}${di.sizhu.hour.tg}${di.sizhu.hour.dz}`
      : "default";
    const reportCacheKey = `yunshu:bazi-report-${sizhuKey}`;

    // 尝试从缓存加载
    try {
      const cached = localStorage.getItem(reportCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // 简单校验：包含所有必要字段
        if (parsed.overview && parsed.rizhuPersonality) {
          setReport(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    // 调用 AI 生成报告
    setLoading(true);
    setError(false);

    const dyi = paipanData.dayun_info;
    const bsi = paipanData.base_info;

    // 四柱完整描述
    const sizhuFull = di?.sizhu
      ? `年柱：${di.sizhu.year.tg}${di.sizhu.year.dz}（${di.nayin?.year || ""}） · 月柱：${di.sizhu.month.tg}${di.sizhu.month.dz}（${di.nayin?.month || ""}） · 日柱：${di.sizhu.day.tg}${di.sizhu.day.dz}（${di.nayin?.day || ""}） · 时柱：${di.sizhu.hour.tg}${di.sizhu.hour.dz}（${di.nayin?.hour || ""}）`
      : "";

    // 神煞摘要
    const shenshaParts: string[] = [];
    if (di?.shensha) {
      for (const [key, val] of Object.entries(di.shensha)) {
        const labels: Record<string, string> = { year: "年", month: "月", day: "日", hour: "时" };
        const names = (val as string).split(/\s+/).filter(Boolean).slice(0, 2);
        if (names.length > 0) shenshaParts.push(`${labels[key] || key}柱：${names.join("、")}`);
      }
    }

    // 大运摘要
    const dayunLines: string[] = [];
    if (dyi?.big) {
      dyi.big.slice(0, 8).forEach((gz, i) => {
        const age = dyi.xu_sui?.[i] ? `${dyi.xu_sui[i]}-${dyi.xu_sui[i] + 9}岁` : `${i * 10}-${i * 10 + 9}岁`;
        dayunLines.push(`${age}：${gz}（${dyi.big_god?.[i] || ""}）`);
      });
    }

    // 五行概况
    const cesuanCache = (() => { try { const c = localStorage.getItem("yunshu:last-cesuan"); return c ? JSON.parse(c) : null; } catch { return null; } })();
    const wuxingLines: string[] = [];
    if (cesuanCache?.xiyongshen) {
      const x = cesuanCache.xiyongshen;
      wuxingLines.push(`金${x.jin_score || "?"}分 · 木${x.mu_score || "?"}分 · 水${x.shui_score || "?"}分 · 火${x.huo_score || "?"}分 · 土${x.tu_score || "?"}分`);
      wuxingLines.push(`身${x.qiangruo || "?"} · ${x.tonglei || ""} / ${x.yilei || ""}`);
    } else {
      wuxingLines.push("需完成「八字测算」获取详细五行分数");
    }

    generateBaziReport({
      data: {
        name: bsi?.name || "用户",
        gender: bsi?.sex || "",
        sizhuFull,
        rizhu: `${di?.sizhu?.day?.tg || ""}${di?.sizhu?.day?.dz || ""}日元`,
        zhengge: bsi?.zhengge || "",
        nayin: di?.nayin ? `${di.nayin.year} · ${di.nayin.month} · ${di.nayin.day} · ${di.nayin.hour}` : "",
        qiyun: bsi?.qiyun || "",
        shenshaSummary: shenshaParts.join("；") || "无",
        dayunSummary: dayunLines.join("\n"),
        wuxingSummary: wuxingLines.join("\n"),
        xiyongshen: cesuanCache?.xiyongshen?.xiyongshen || "",
        jishen: cesuanCache?.xiyongshen?.jishen || "",
        chenggu: cesuanCache?.chenggu ? `${cesuanCache.chenggu.total_weight} — ${cesuanCache.chenggu.description}` : "",
      },
    })
      .then((result) => {
        if (result.success) {
          setReport(result.report);
          try { localStorage.setItem(reportCacheKey, JSON.stringify(result.report)); } catch { /* ignore */ }
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [paipanData]);

  if (!paipanData) return null;

  const reportSections = [
    { key: "overview", icon: BookOpen, title: "命盘总览", content: report?.overview, color: "text-primary bg-primary/10" },
    { key: "rizhuPersonality", icon: User, title: "日主解读", content: report?.rizhuPersonality, color: "text-[var(--cinnabar)] bg-[color-mix(in_oklab,var(--cinnabar)_12%,transparent)]" },
    { key: "wuxingLife", icon: Droplets, title: "五行与生活", content: report?.wuxingLife, color: "text-[var(--jade)] bg-[color-mix(in_oklab,var(--jade)_12%,transparent)]" },
    { key: "dayunStory", icon: Calendar, title: "大运人生", content: report?.dayunStory, color: "text-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_12%,transparent)]" },
    { key: "shenshaFun", icon: Star, title: "神煞趣解", content: report?.shenshaFun, color: "text-accent bg-accent/10" },
    { key: "lifeAdvice", icon: Compass, title: "人生锦囊", content: report?.lifeAdvice, color: "text-[var(--jade)] bg-[color-mix(in_oklab,var(--jade)_12%,transparent)]" },
  ];

  return (
    <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="font-serif-cn text-base font-medium">AI 八字深度分析报告</p>
          <p className="text-[11px] text-muted-foreground">
            {loading ? "AI 正在分析命盘..." : report ? "基于八字排盘 · AI 通俗解读" : error ? "AI 分析暂不可用" : "准备中..."}
          </p>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="mt-5 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="font-serif-cn text-sm text-muted-foreground">枢机正在细细解读你的命盘...</p>
          <p className="mt-1 text-[11px] text-muted-foreground">这可能需要几秒钟</p>
        </div>
      )}

      {/* AI 报告内容 */}
      {report && !loading && (
        <div className="mt-4 space-y-3">
          {reportSections.map((s) => {
            if (!s.content) return null;
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="font-serif-cn text-sm font-medium">{s.title}</p>
                </div>
                <p className="text-[13px] leading-6 text-foreground/85 whitespace-pre-line"><MarkdownText text={s.content} /></p>
              </div>
            );
          })}
        </div>
      )}

      {/* 错误回退：显示原始数据 */}
      {error && !loading && !report && (
        <div className="mt-4 space-y-3">
          <p className="text-[11px] text-muted-foreground text-center py-4">AI 分析暂不可用，以下为基础排盘数据</p>
          <StaticReport paipanData={paipanData} />
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-secondary/60 p-3 text-[11px] leading-5 text-muted-foreground">
        💡 AI 分析由大语言模型基于八字排盘数据生成，用通俗语言解读。如需追问，可前往{" "}
        <Link to="/chat" className="text-primary">咨询枢机</Link>。
      </div>
    </section>
  );
}

// 静态回退报告（当 AI 不可用时）
function StaticReport({ paipanData }: { paipanData: PaipanData }) {
  const { detail_info: di, dayun_info: dyi, base_info: bsi } = paipanData;

  const sizhuStr = di?.sizhu
    ? `${di.sizhu.year.tg}${di.sizhu.year.dz} · ${di.sizhu.month.tg}${di.sizhu.month.dz} · ${di.sizhu.day.tg}${di.sizhu.day.dz} · ${di.sizhu.hour.tg}${di.sizhu.hour.dz}`
    : "";

  const dayunItems = dyi?.big
    ? dyi.big.slice(0, 6).map((gz, i) => ({
        label: dyi.xu_sui?.[i] ? `${dyi.xu_sui[i]}-${dyi.xu_sui[i] + 9} 岁` : `${8 + i * 10}-${17 + i * 10} 岁`,
        gz,
        note: dyi.big_god?.[i] || "",
        hot: i === 2 || i === 3,
      }))
    : [];

  return (
    <>
      <div className="rounded-2xl border border-border/60 p-4">
        <p className="font-serif-cn text-sm font-medium">📜 基本信息</p>
        <div className="mt-2 space-y-1 text-[12px] leading-5">
          <p><span className="text-primary">四柱：</span>{sizhuStr}</p>
          <p><span className="text-primary">格局：</span>{bsi?.zhengge || "—"}</p>
          <p><span className="text-primary">起运：</span>{bsi?.qiyun || "—"}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 p-4">
        <p className="font-serif-cn text-sm font-medium">🌙 大运走势</p>
        <div className="mt-2 space-y-1 text-[12px] leading-5">
          {dayunItems.map((d) => (
            <p key={d.label}><span className="text-primary">{d.label}：</span>{d.gz} — {d.note}{d.hot ? " ✨" : ""}</p>
          ))}
        </div>
      </div>
    </>
  );
}

function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-medium text-foreground">{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

// ==================== FateChart — 命理图（可保存/分享） ====================

interface FateChartProps {
  paipanData?: PaipanData;
  formData?: {
    gender: string;
    birthDate: string;
    birthTime: string;
    birthPlace?: string;
    calendar?: string;
  };
}

export function FateChart({ paipanData, formData }: FateChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const role = typeof window !== "undefined" ? getActiveRole() : null;

  const displayName = formData ? (role?.name || "我") : (role?.name || "我");
  const displayGender = formData?.gender || role?.gender || "";
  const displayDate = formData?.birthDate || role?.birthDate || "";
  const displayTime = formData?.birthTime || role?.birthTime || "";

  const sizhu = paipanData?.detail_info?.sizhu;

  // 五行数据
  const elements = [
    { n: "木", v: 25, c: "#7bc47f" },
    { n: "火", v: 20, c: "#e07a5f" },
    { n: "土", v: 25, c: "#d4a657" },
    { n: "金", v: 20, c: "#c9c9d1" },
    { n: "水", v: 10, c: "#6a9bd1" },
  ];

  const onSave = async () => {
    const el = ref.current;
    if (!el) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1530",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `云枢易馆_八字命理图_${displayName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("命理图已保存", { description: "PNG 图片已下载到本地" });
    } catch (e) {
      console.error("FateChart save error:", e);
      toast.error("保存失败", { description: (e as Error).message?.slice(0, 30) || "请稍后重试" });
    }
  };

  const onShare = async () => {
    const el = ref.current;
    if (!el) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1530",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("图片生成失败");

      const file = new File([blob], `云枢易馆_八字命理图_${displayName}.png`, { type: "image/png" });

      // 尝试 Web Share API（手机上能用 files 分享）
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "我的八字命理图 · 云枢易馆" });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return; // 用户取消
        }
      }

      // 回退：先下载，再复制一段分享文案
      const link = document.createElement("a");
      link.download = `云枢易馆_八字命理图_${displayName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      try {
        await navigator.clipboard.writeText("古法藏枢机，AI 解流年 —— 这是我的八字命理图，来自「云枢易馆」");
        toast.success("图片已下载 + 分享文案已复制", { description: "可直接粘贴到微信发送给好友" });
      } catch {
        toast.success("图片已下载", { description: "可长按图片发送给好友" });
      }
    } catch (e) {
      console.error("FateChart share error:", e);
      toast.error("分享失败", { description: (e as Error).message?.slice(0, 30) || "请稍后重试" });
    }
  };

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-serif-cn text-sm font-medium">🖼️ 我的八字命理图</p>
        <span className="text-[11px] text-muted-foreground">可保存 / 分享</span>
      </div>

      <div
        ref={ref}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-floating"
        style={{
          background:
            "linear-gradient(160deg, #2d1a4e 0%, #171f3a 50%, #3a1a08 100%)",
        }}
      >
        {/* 装饰云纹 */}
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,215,150,0.4), transparent 40%), radial-gradient(circle at 80% 90%, rgba(150,200,255,0.3), transparent 40%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="font-serif-cn text-[11px] tracking-[0.3em] opacity-70">YUN SHU YI GUAN</p>
            <p className="font-serif-cn text-[11px] opacity-70">云枢易馆</p>
          </div>
          <p className="mt-3 font-serif-cn text-2xl">{displayName} · 八字命理</p>
          <p className="mt-1 text-[11px] opacity-70">
            {displayGender === "男" ? "乾造" : "坤造"} · {displayDate} {displayTime}
          </p>

          {/* 四柱 — 五行颜色，按行列展示 */}
          <div className="mt-5">
            <div className="grid grid-cols-[1.8rem_1fr_1fr_1fr_1fr] gap-1.5 mb-1">
              <span />
              {sizhu
                ? [{ l: "年", ...sizhu.year }, { l: "月", ...sizhu.month }, { l: "日", ...sizhu.day }, { l: "时", ...sizhu.hour }]
                  .map((p) => <p key={p.l} className="text-[9px] opacity-50 text-center">{p.l}柱</p>)
                : ["年","月","日","时"].map((l) => <p key={l} className="text-[9px] opacity-50 text-center">{l}柱</p>)
              }
            </div>
            <div className="grid grid-cols-[1.8rem_1fr_1fr_1fr_1fr] gap-1.5 mb-1">
              <span className="text-[8px] opacity-40 flex items-center justify-end pr-0.5">干</span>
              {sizhu
                ? [{ l: "年", ...sizhu.year }, { l: "月", ...sizhu.month }, { l: "日", ...sizhu.day }, { l: "时", ...sizhu.hour }]
                  .map((p) => {
                    const gInfo = GAN_WUXING[p.tg] || { color: "#f4d58a" };
                    return (
                      <div key={p.l} className="rounded-xl border border-white/10 bg-white/10 py-2 text-center">
                        <p className="font-serif-cn text-xl font-bold" style={{ color: gInfo.color }}>{p.tg}</p>
                      </div>
                    );
                  })
                : ["—","—","—","—"].map((x, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/10 py-2 text-center">
                      <p className="font-serif-cn text-xl" style={{ color: "#f4d58a" }}>{x}</p>
                    </div>
                  ))
              }
            </div>
            <div className="grid grid-cols-[1.8rem_1fr_1fr_1fr_1fr] gap-1.5">
              <span className="text-[8px] opacity-40 flex items-center justify-end pr-0.5">支</span>
              {sizhu
                ? [{ l: "年", ...sizhu.year }, { l: "月", ...sizhu.month }, { l: "日", ...sizhu.day }, { l: "时", ...sizhu.hour }]
                  .map((p) => {
                    const zInfo = ZHI_WUXING[p.dz] || { color: "#e0e0e0" };
                    return (
                      <div key={p.l} className="rounded-xl border border-white/10 bg-white/10 py-1.5 text-center">
                        <p className="font-serif-cn text-lg font-bold" style={{ color: zInfo.color }}>{p.dz}</p>
                      </div>
                    );
                  })
                : ["—","—","—","—"].map((x, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/10 py-1.5 text-center">
                      <p className="font-serif-cn text-lg">{x}</p>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* 五行环 */}
          <div className="mt-5 flex items-center justify-around">
            {elements.map((e) => (
              <div key={e.n} className="flex flex-col items-center">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke={e.c} strokeWidth="3"
                      strokeDasharray={`${e.v} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-serif-cn text-sm">{e.n}</span>
                </div>
                <span className="mt-1 text-[10px] opacity-60">{e.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-[11px] leading-5">
            <p className="opacity-80">
              日元 {sizhu ? `${sizhu.day.tg}${sizhu.day.dz}` : "—"}
            </p>
            <p className="opacity-60">
              格局：{paipanData?.base_info?.zhengge || "—"}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <p className="font-serif-cn text-[11px] opacity-60">古法藏枢机 · AI 解流年</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-[8px] text-black">QR</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onSave} className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-sm font-medium shadow-soft active:scale-[0.98]">
          <Download className="h-4 w-4" /> 保存命理图
        </button>
        <button onClick={onShare} className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-floating active:scale-[0.98]">
          <Share2 className="h-4 w-4" /> 分享给好友
        </button>
      </div>
    </section>
  );
}
