import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import {
  Sparkles, Briefcase, Coins, HeartHandshake, Users2, Smile,
  Share2, Flame, ChevronRight, Calendar, Bookmark, BookmarkCheck,
  Palette, Hash, Check, X, ChevronDown, UserPlus,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  yearlyPrompts, readBookmarks, toggleBookmark,
} from "@/lib/yearlyPrompts";
import {
  readRoles, readActiveRoleId, setActiveRoleId, removeRole, ROLE_CHANGE_EVENT, type Role,
} from "@/lib/roles";
import { getDailyFortune, calculateBazi } from "@/lib/api/yuanfenju.functions";
import type { YunshiData, PaipanData } from "@/lib/api/yuanfenju.types";
import { analyzeFortune, analyzeDayunDetail, type FortuneAnalysisResult } from "@/lib/api/fortune-analysis.functions";
import { MarkdownText } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "今日运势 · 云枢易馆" },
      { name: "description", content: "古法藏枢机，AI 解流年。每日运势、节气提示与温柔的 AI 心理陪伴。" },
    ],
  }),
  component: HomePage,
});

const fortunes = [
  { key: "事业", icon: Briefcase, stars: 4, detail: "今日事业运稳中有升，适合推进既定计划。上午沟通效率较高，若有汇报或谈判宜安排在午时前。" },
  { key: "财运", icon: Coins, stars: 3, detail: "财运平稳，正财可期，偏财谨慎。今日不宜大额支出或冲动投资，记账与复盘比开源更重要。" },
  { key: "情感", icon: HeartHandshake, stars: 5, detail: "情感运势如沐春风，单身者宜主动邀约，有伴者适合安排一次轻松对话，关系会因此升温。" },
  { key: "人际", icon: Users2, stars: 4, detail: "贵人运在线，前辈或同辈中有人愿意伸手。遇到难题不妨开口求助，回应比你预想得更温暖。" },
  { key: "情绪", icon: Smile, stars: 4, detail: "情绪总体平和，午后可能略有浮躁。给自己十分钟的独处时间，饮茶或静坐即可化解。" },
];

const luckyColors = [
  { name: "松烟青", hex: "#3a5a6c" },
  { name: "鎏金", hex: "#c9a14a" },
];
const luckyNumbers = [3, 8];
const yi = ["出行", "签约", "会友", "整理"];
const ji = ["争辩", "动土", "大额消费"];
const luckyDirection = "正北";
const luckyTime = "巳时 09:00 - 11:00";

// 迷你条形图 — 展示运势分数
function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [openFortune, setOpenFortune] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [yunshiData, setYunshiData] = useState<YunshiData | null>(null);
  const [yunshiLoading, setYunshiLoading] = useState(false);
  const [checkInDays, setCheckInDays] = useState(7);
  const [checkedToday, setCheckedToday] = useState(false);
  const [paipanData, setPaipanData] = useState<PaipanData | null>(null);
  const [dayunList, setDayunList] = useState<{ age: string; gz: string; note: string; current: boolean }[]>([]);
  const [liunianList, setLiunianList] = useState<{ year: string; gz: string }[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<FortuneAnalysisResult | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [dayunDialogOpen, setDayunDialogOpen] = useState(false);
  const [dayunDialogData, setDayunDialogData] = useState<{ gz: string; god: string; age: string } | null>(null);
  const [dayunAnalysisText, setDayunAnalysisText] = useState("");
  const [dayunAnalysisLoading, setDayunAnalysisLoading] = useState(false);

  const handleDayunClick = async (gz: string, god: string, age: string) => {
    setDayunDialogData({ gz, god, age });
    setDayunDialogOpen(true);
    setDayunAnalysisText("");
    setDayunAnalysisLoading(true);
    const bsi = paipanData?.base_info;
    const di = paipanData?.detail_info;
    const sizhu = di?.sizhu;
    const sizhuStr = sizhu ? `${sizhu.year.tg}${sizhu.year.dz} ${sizhu.month.tg}${sizhu.month.dz} ${sizhu.day.tg}${sizhu.day.dz} ${sizhu.hour.tg}${sizhu.hour.dz}` : "";
    const cesuanCache = (() => { try { const c = localStorage.getItem("yunshu:last-cesuan"); return c ? JSON.parse(c) : null; } catch { return null; } })();
    try {
      const r = await analyzeDayunDetail({
        data: {
          name: activeRole?.name || "用户", gender: activeRole?.gender || "",
          dayunGz: gz, dayunGod: god, ageRange: age,
          rizhu: sizhu ? `${sizhu.day.tg}${sizhu.day.dz}日元` : "",
          zhengge: bsi?.zhengge || "", xiyongshen: cesuanCache?.xiyongshen?.xiyongshen || "", sizhu: sizhuStr,
        },
      });
      if (r.success) setDayunAnalysisText(r.analysis);
    } catch { setDayunAnalysisText("网络错误"); }
    setDayunAnalysisLoading(false);
  };

  // 打卡初始化
  useEffect(() => {
    const last = localStorage.getItem("yunshu:checkin-date");
    if (last === new Date().toDateString()) setCheckedToday(true);
    setCheckInDays(parseInt(localStorage.getItem("yunshu:checkin-streak") || "7"));
  }, []);

  const handleCheckIn = () => {
    const today = new Date().toDateString();
    if (localStorage.getItem("yunshu:checkin-date") === today) return;
    localStorage.setItem("yunshu:checkin-date", today);
    const next = checkInDays + 1;
    localStorage.setItem("yunshu:checkin-streak", String(next));
    setCheckInDays(next);
    setCheckedToday(true);
    toast.success("打卡成功！", { description: `连续打卡 ${next} 天 · 积分 +${10 + next}` });
  };

  useEffect(() => {
    setBookmarkedIds(readBookmarks());
    setRoles(readRoles());
    setActiveId(readActiveRoleId());
    const bm = () => setBookmarkedIds(readBookmarks());
    const rl = () => { setRoles(readRoles()); setActiveId(readActiveRoleId()); };
    window.addEventListener("yunshu:bookmarks-change", bm);
    window.addEventListener(ROLE_CHANGE_EVENT, rl);
    return () => {
      window.removeEventListener("yunshu:bookmarks-change", bm);
      window.removeEventListener(ROLE_CHANGE_EVENT, rl);
    };
  }, []);

  const activeRole = useMemo(() => roles.find((r) => r.id === activeId) || roles[0], [roles, activeId]);
  const activeFortune = fortunes.find((f) => f.key === openFortune);

  // 获取每日运势数据
  useEffect(() => {
    if (!activeRole) return;
    setYunshiLoading(true);
    setLoading(true);

    getDailyFortune({
      data: {
        name: activeRole.name || "用户",
        gender: activeRole.gender,
        birthDate: activeRole.birthDate,
        birthTime: activeRole.birthTime,
        calendar: activeRole.calendar || "公历",
      },
    })
      .then((result) => {
        if (result.success) {
          setYunshiData(result.data);
        }
      })
      .catch(() => { /* 静默失败，保留静态数据 */ })
      .finally(() => {
        setYunshiLoading(false);
        setLoading(false);
      });
  }, [activeRole]);

  // 获取八字排盘数据（用于大运/流年展示）
  useEffect(() => {
    if (!activeRole) return;
    // 先尝试从缓存获取
    try {
      const cached = localStorage.getItem("yunshu:last-paipan");
      if (cached) {
        const p = JSON.parse(cached) as PaipanData;
        if (p.base_info && p.dayun_info) {
          setPaipanData(p);
          extractDayunLiunian(p);
          return;
        }
      }
    } catch { /* ignore */ }

    // 无缓存则请求 API
    calculateBazi({
      data: {
        name: activeRole.name || "用户",
        gender: activeRole.gender,
        birthDate: activeRole.birthDate,
        birthTime: activeRole.birthTime,
        calendar: activeRole.calendar || "公历",
      },
    })
      .then((result) => {
        if (result.success && result.data) {
          setPaipanData(result.data);
          extractDayunLiunian(result.data);
          // 缓存排盘结果
          try { localStorage.setItem("yunshu:last-paipan", JSON.stringify(result.data)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* 静默失败 */ });
  }, [activeRole]);

  // 从排盘数据中提取大运和流年
  function extractDayunLiunian(data: PaipanData) {
    const dyi = data.dayun_info;
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(data.base_info?.gongli?.slice(0, 4) || "1990");

    // 提取大运列表（取当前大运附近）
    const dayuns: { age: string; gz: string; note: string; current: boolean }[] = [];
    const startYears = dyi.big_start_year || [];
    const endYears = dyi.big_end_year || [];

    dyi.big.forEach((gz, i) => {
      const startY = startYears[i] || birthYear + (dyi.xu_sui?.[i] || i * 10);
      const endY = endYears[i] || startY + 9;
      const isCurrent = currentYear >= startY && currentYear <= endY;
      dayuns.push({
        age: `${dyi.xu_sui?.[i] || i * 10}-${(dyi.xu_sui?.[i] || i * 10) + 9}`,
        gz,
        note: dyi.big_god?.[i] || "",
        current: isCurrent,
      });
    });
    setDayunList(dayuns.slice(0, 8));

    // 提取流年列表 — 解析增强后的 year_char: "2026年（丙午·正财）"
    const currentDayunIdx = dayuns.findIndex((d) => d.current);
    const liunianKey = `years_info${currentDayunIdx >= 0 ? currentDayunIdx : 0}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liunianData = (dyi as any)[liunianKey] as { year_char: string }[] | undefined;
    if (liunianData && liunianData.length > 0) {
      const lns = liunianData.slice(0, 6).map((y) => {
        const yearMatch = y.year_char.match(/^(\d+)年（(.+?)·(.+?)）$/);
        return {
          year: yearMatch ? yearMatch[1] : y.year_char.replace("年", ""),
          gz: yearMatch ? `${yearMatch[1]}年（${yearMatch[2]}·${yearMatch[3]}）` : y.year_char,
        };
      });
      setLiunianList(lns);
    }
  }

  // 当八字排盘 + 运势数据都就绪后，调用 DeepSeek 做 AI 分析
  useEffect(() => {
    if (!paipanData || !yunshiData || aiAnalysis) return;

    const di = paipanData.detail_info;
    const bsi = paipanData.base_info;
    const dyi = paipanData.dayun_info;
    const yi = yunshiData.yunshi_info;

    // 构建神煞字符串
    const shenshaParts: string[] = [];
    if (di.shensha) {
      for (const [key, val] of Object.entries(di.shensha)) {
        const names = (val as string).split(/\s+/).filter(Boolean).slice(0, 2);
        if (names.length > 0) shenshaParts.push(...names);
      }
    }
    const shenshaStr = [...new Set(shenshaParts)].slice(0, 6).join("、");

    // 找当前大运
    const currentYear = new Date().getFullYear();
    const currentDayunIdx = (dyi.big_start_year || []).findIndex(
      (y: number) => y <= currentYear && ((dyi.big_end_year || [])[dyi.big_start_year.indexOf(y)] || 9999) >= currentYear
    );
    const currentDayunGz = currentDayunIdx >= 0 ? (dyi.big[currentDayunIdx] || "") : "";
    const currentDayunGod = currentDayunIdx >= 0 ? (dyi.big_god?.[currentDayunIdx] || "") : "";

    // 找当前流年
    const liunianKey = `years_info${currentDayunIdx >= 0 ? currentDayunIdx : 0}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liunianData = (dyi as any)[liunianKey] as { year_char: string }[] | undefined;
    const currentLiunian = liunianData?.[0]?.year_char || `${currentYear}年`;

    // 五行简述
    const wuxingLabels = ["木", "火", "土", "金", "水"];
    const wuxingDesc = yunshiData.base_info?.wuxing_xiji || "";

    setAiAnalysisLoading(true);
    analyzeFortune({
      data: {
        name: activeRole?.name || "用户",
        gender: activeRole?.gender || "男",
        birthDate: activeRole?.birthDate || "",
        sizhu: `${di.sizhu.year.tg}${di.sizhu.year.dz} ${di.sizhu.month.tg}${di.sizhu.month.dz} ${di.sizhu.day.tg}${di.sizhu.day.dz} ${di.sizhu.hour.tg}${di.sizhu.hour.dz}`,
        rizhu: `${di.sizhu.day.tg}${di.sizhu.day.dz}日元`,
        zhengge: bsi.zhengge || "",
        currentDayun: currentDayunGz,
        currentDayunGod: currentDayunGod,
        currentLiunian,
        qiyun: bsi.qiyun || "",
        xiyongshen: yunshiData.base_info?.xiyongshen?.xiyongshen || "",
        jishen: yunshiData.base_info?.xiyongshen?.jishen || "",
        wuxing: wuxingDesc,
        shensha: shenshaStr,
        careerScore: yi.career_score,
        wealthScore: yi.wealth_score,
        loveScore: yi.love_score,
        healthScore: yi.health_score,
        fortuneScore: yi.fortune_score,
        luckyYi: yi.lucky_yi,
        luckyJi: yi.lucky_ji,
        luckyColor: yi.lucky_color,
        luckyNumber: yi.lucky_number,
        luckyDirection: yi.lucky_directions,
        jixiong: yi.jixiong_today,
      },
    })
      .then((result) => {
        if (result.success) {
          setAiAnalysis(result.analysis);
          // 缓存分析结果
          try { localStorage.setItem(`yunshu:ai-analysis-${activeRole?.id || "self"}`, JSON.stringify(result.analysis)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* AI 分析失败不影响基础展示 */ })
      .finally(() => setAiAnalysisLoading(false));
  }, [paipanData, yunshiData]);

  // 尝试从缓存加载 AI 分析
  useEffect(() => {
    if (aiAnalysis || !paipanData) return;
    try {
      const cached = localStorage.getItem(`yunshu:ai-analysis-${activeRole?.id || "self"}`);
      if (cached) setAiAnalysis(JSON.parse(cached));
    } catch { /* ignore */ }
  }, [paipanData]);

  const handleToggleBookmark = (id: string, title: string) => {
    const next = toggleBookmark(id);
    const added = next.includes(id);
    toast(added ? "已收藏流年提示" : "已取消收藏", {
      description: title,
      action: added
        ? { label: "查看收藏", onClick: () => { window.location.href = "/bookmarks"; } }
        : undefined,
    });
  };

  const switchRole = (id: string) => {
    setActiveRoleId(id);
    setRoleOpen(false);
    const r = roles.find((x) => x.id === id);
    if (r) toast(`已切换到 ${r.name} 的运势`, { description: `${r.gender} · ${r.calendar === "农历" ? "农历" : ""}${r.birthDate}` });
  };

  const handleDeleteRole = (id: string, name: string) => {
    if (roles.length <= 1) {
      toast.error("至少保留一个角色");
      return;
    }
    removeRole(id);
    toast(`已删除「${name}」`);
    // 刷新本地状态
    setRoles(readRoles());
    setActiveId(readActiveRoleId());
  };

  return (
    <MobileShell>
      <div className="scroll-paper px-5 pb-6 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-serif-cn text-lg font-semibold tracking-wide">云枢易馆</p>
              <p className="text-[11px] text-muted-foreground">古法藏枢机 · AI 解流年</p>
            </div>
          </div>
          <Link to="/profile" className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            会员中心
          </Link>
        </div>

        {/* 角色切换 */}
        <button
          onClick={() => setRoleOpen(true)}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 text-left backdrop-blur active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
            {activeRole?.avatar || "🌿"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-serif-cn text-sm font-medium">{activeRole?.name || "我自己"}</p>
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {activeRole?.gender} · {activeRole?.calendar === "农历" ? "农历" : ""}{activeRole?.birthDate}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">点此切换角色查看运势 · 共 {roles.length}/5</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>丙午年 · 癸巳月 · 戊辰日</span>
          <span className="ml-auto rounded-full bg-card/70 px-2 py-0.5">芒种 第三日</span>
        </div>

        <div className="mt-3 rounded-3xl bg-card/80 p-5 shadow-soft backdrop-blur">
          <p className="font-serif-cn text-sm text-muted-foreground">
            {yunshiData ? `今日命理指数 · ${yunshiData.yunshi_info.jixiong_today}` : "今日命理指数"}
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {(loading || yunshiLoading)
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Skeleton className="h-10 w-10 rounded-2xl" />
                    <Skeleton className="h-3 w-8 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                ))
              : fortunes.map((f) => {
                  const Icon = f.icon;
                  // 使用真实分数（0-100）
                  let score = 60;
                  let barColor = "var(--primary)";
                  if (yunshiData) {
                    const scores: Record<string, number> = {
                      "事业": yunshiData.yunshi_info.career_score,
                      "财运": yunshiData.yunshi_info.wealth_score,
                      "情感": yunshiData.yunshi_info.love_score,
                      "人际": yunshiData.yunshi_info.fortune_score,
                      "情绪": yunshiData.yunshi_info.health_score,
                    };
                    score = scores[f.key] || 60;
                  }
                  // 根据分数选颜色
                  if (score >= 80) barColor = "#4a9e6e";
                  else if (score >= 60) barColor = "#6a9ed9";
                  else if (score >= 40) barColor = "#d4a84a";
                  else barColor = "#d94e3c";

                  return (
                    <button
                      key={f.key}
                      onClick={() => setOpenFortune(f.key)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl bg-transparent p-1 transition-transform active:scale-95 w-full"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] text-foreground">{f.key}</span>
                      <span className="text-[11px] font-medium" style={{ color: barColor }}>{score}</span>
                      <ScoreBar score={score} color={barColor} />
                    </button>
                  );
                })}
          </div>
        </div>
      </div>

      {/* 下半区：手机单列；平板/桌面自动分 2 列瀑布流，充分利用宽屏 */}
      <div className="px-5 [&>*]:mb-5 md:columns-2 md:gap-5 md:[&>*]:break-inside-avoid">
        {/* AI 今日深度分析（DeepSeek 基于八字推理） */}
        <section className="-mt-2 rounded-3xl bg-gradient-to-br from-primary/8 via-card to-accent/8 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {aiAnalysisLoading ? "AI 正在分析命盘..." : "AI 命理深度分析"}
            </div>
            <button className="flex items-center gap-1 text-xs text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" /> 分享
            </button>
          </div>
          {loading || aiAnalysisLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </div>
          ) : aiAnalysis?.dailyComment ? (
            <>
              <p className="mt-3 font-serif-cn text-sm leading-7 text-foreground whitespace-pre-line">
                <MarkdownText text={aiAnalysis.dailyComment} />
              </p>
              {/* 分维速读标签 */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { label: "事业", text: aiAnalysis.careerHint },
                  { label: "财运", text: aiAnalysis.wealthHint },
                  { label: "情感", text: aiAnalysis.loveHint },
                  { label: "健康", text: aiAnalysis.healthHint },
                ].filter(h => h.text).map((h) => (
                  <span key={h.label} className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] leading-4">
                    <span className="text-muted-foreground">{h.label}：</span>
                    <span className="text-foreground/80">{h.text}</span>
                  </span>
                ))}
              </div>
              {aiAnalysis.luckyAdvice && (
                <p className="mt-2 text-[11px] text-primary/80 italic">💡 {aiAnalysis.luckyAdvice}</p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <Link to="/reading" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary">
                  查看完整解读 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/chat" className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
                  追问 AI
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 font-serif-cn text-base leading-7 text-foreground">
                {yunshiData
                  ? yunshiData.yunshi_info.fortune_description
                  : "水木相生，今日宜静中观变。上午灵感来得轻盈，适合写下三件被你搁置的小事；黄昏时分若有人来询意见，请放慢半拍再答。"}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link to="/reading" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary">
                  查看完整 AI 解读 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/chat" className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
                  追问 AI
                </Link>
              </div>
            </>
          )}
        </section>

        {/* 幸运色 / 幸运数字 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Palette className="h-3.5 w-3.5" /> 今日幸运色
            </div>
            <div className="mt-3 flex items-center gap-2">
              {(yunshiData
                ? yunshiData.yunshi_info.lucky_color.split("、").map((c, i) => ({
                    name: c,
                    hex: ["#3a5a6c", "#c9a14a", "#c9c9d1", "#6a9bd1"][i] || "#3a5a6c",
                  }))
                : luckyColors
              ).map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-1">
                  <span className="h-9 w-9 rounded-full shadow-soft ring-2 ring-border/60" style={{ background: c.hex }} />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="h-3.5 w-3.5" /> 今日幸运数字
            </div>
            <div className="mt-3 flex items-center gap-2">
              {(yunshiData
                ? yunshiData.yunshi_info.lucky_number.split("、").map(Number)
                : luckyNumbers
              ).slice(0, 2).map((n) => (
                <span key={n} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-serif-cn text-lg text-primary">{n}</span>
              ))}
              <div className="ml-1 flex-1 text-[10px] leading-4 text-muted-foreground">
                <p>方位：{yunshiData?.yunshi_info.lucky_directions || luckyDirection}</p>
                <p>时辰：{luckyTime}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 今日宜忌 */}
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-serif-cn text-sm font-medium">今日宜忌</p>
            <span className="text-[11px] text-muted-foreground">黄历 · 戊辰日</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[color-mix(in_oklab,var(--jade)_30%,transparent)] bg-[color-mix(in_oklab,var(--jade)_6%,transparent)] p-3">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--jade)] text-[10px] text-white">
                  <Check className="h-3 w-3" />
                </span>
                <span className="font-serif-cn text-sm text-[var(--jade)]">宜</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(yunshiData
                  ? yunshiData.yunshi_info.lucky_yi.split("、")
                  : yi
                ).map((y) => (
                  <span key={y} className="rounded-full bg-card px-2.5 py-0.5 text-[11px] text-foreground/80">{y}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[color-mix(in_oklab,var(--cinnabar)_30%,transparent)] bg-[color-mix(in_oklab,var(--cinnabar)_6%,transparent)] p-3">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cinnabar)] text-[10px] text-white">
                  <X className="h-3 w-3" />
                </span>
                <span className="font-serif-cn text-sm text-[var(--cinnabar)]">忌</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(yunshiData
                  ? yunshiData.yunshi_info.lucky_ji.split("、")
                  : ji
                ).map((j) => (
                  <span key={j} className="rounded-full bg-card px-2.5 py-0.5 text-[11px] text-foreground/80">{j}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
            <div className="rounded-xl bg-muted/40 px-3 py-2">值神：<span className="text-foreground">青龙</span></div>
            <div className="rounded-xl bg-muted/40 px-3 py-2">冲煞：<span className="text-foreground">冲狗 煞南</span></div>
          </div>
        </section>

        {/* 打卡 */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif-cn text-base font-medium">今日运势打卡</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {checkedToday
                  ? <span>今日已打卡 · 连续 <span className="text-primary">{checkInDays}</span> 天</span>
                  : <span>已连续打卡 <span className="text-primary">{checkInDays}</span> 天 · 积分 +{10 + checkInDays}</span>}
              </p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={checkedToday}
              className={`rounded-full px-5 py-2 text-sm font-medium shadow-soft transition ${
                checkedToday
                  ? "bg-muted text-muted-foreground cursor-default"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
              }`}
            >
              {checkedToday ? "已打卡" : "打卡"}
            </button>
          </div>
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < (checkInDays % 7) ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </section>

        {/* 大运 & 流年（基于真实八字排盘） */}
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[var(--cinnabar)]" />
              <p className="font-serif-cn text-sm font-medium">大运 · 流年</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {bookmarkedIds.length > 0 && (
                <Link to="/bookmarks" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                  <Bookmark className="h-3 w-3" /> 已收藏 {bookmarkedIds.length}
                </Link>
              )}
              <Link to="/reading" className="text-primary">查看详情 →</Link>
            </div>
          </div>

          {/* 当前大运 — 含 AI 解读 */}
          {dayunList.filter(d => d.current).length > 0 && (
            <div className="mb-3 rounded-2xl bg-primary/5 border border-primary/20 p-3">
              <p className="text-[11px] text-muted-foreground">当前大运</p>
              {dayunList.filter(d => d.current).map((d) => (
                <div key={d.age}>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-serif-cn text-base text-primary">{d.gz} <span className="text-xs text-muted-foreground">({d.age}岁)</span></p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">{d.note || "大运"}</span>
                  </div>
                  {aiAnalysis?.dayunAnalysis && (
                    <p className="mt-2 text-xs leading-5 text-foreground/75 whitespace-pre-line"><MarkdownText text={aiAnalysis.dayunAnalysis} /></p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 流年提示 — 含 AI 解读 */}
          {aiAnalysis?.liunianHint && (
            <div className="mb-3 rounded-2xl bg-accent/5 border border-accent/20 p-3">
              <p className="text-[11px] text-muted-foreground">流年 AI 提示</p>
              <p className="mt-1 text-xs leading-5 text-foreground/75 whitespace-pre-line"><MarkdownText text={aiAnalysis.liunianHint} /></p>
            </div>
          )}

          {/* 流年列表 */}
          {liunianList.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {liunianList.map((ln, i) => {
                const isCurrentYear = ln.year.includes(String(new Date().getFullYear()));
                const gzMatch = ln.gz.match(/（(.+?)·(.+?)）$/);
                const ganzhi = gzMatch ? gzMatch[1] : "";
                const shishen = gzMatch ? gzMatch[2] : "";
                const hints: Record<string, string> = {
                  "比肩": "同辈助力，宜合作共赢", "劫财": "人际活跃，谨防破财",
                  "食神": "创意迸发，宜学新技能", "伤官": "才思敏捷，注意口舌",
                  "正财": "正财运佳，稳定增长", "偏财": "偏财运旺，机遇与风险并存",
                  "正官": "事业上升，适合晋升", "七杀": "挑战与机遇并存，突破自我",
                  "正印": "贵人运强，宜进修", "偏印": "深耕专业，独立思考",
                };
                const hint = shishen ? (hints[shishen] || "运势流转，顺势而为") : "";
                return (
                  <li key={ln.gz} className={`flex items-start gap-3 rounded-xl p-2 -mx-2 ${isCurrentYear ? "bg-primary/5" : ""}`}>
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isCurrentYear ? "bg-primary" : "bg-accent"}`} />
                    <div className="flex-1">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">{ln.year}年</span>
                        {ganzhi && <span className="text-[11px] text-muted-foreground">{ganzhi}</span>}
                        {shishen && <span className="text-[10px] text-primary/70">{shishen}</span>}
                        {isCurrentYear && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">当前</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-1 text-sm">
              {yearlyPrompts.slice(0, 2).map((p) => {
                const marked = bookmarkedIds.includes(p.id);
                return (
                  <li key={p.id} className="group flex items-start gap-2 rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/50">
                    <Link to="/reading" className="flex flex-1 items-start gap-3">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${p.tone === "primary" ? "bg-primary" : "bg-accent"}`} />
                      <div className="flex-1">
                        <p>{p.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleBookmark(p.id, p.title); }}
                      aria-label={marked ? "取消收藏" : "收藏"}
                      aria-pressed={marked}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        marked
                          ? "text-[var(--cinnabar)] bg-[color-mix(in_oklab,var(--cinnabar)_10%,transparent)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {marked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 附近大运速览 */}
          {dayunList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground mb-2">一生大运排布（点击查看详解）</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {dayunList.map((d) => (
                  <button
                    key={d.age}
                    onClick={() => handleDayunClick(d.gz, d.note, d.age)}
                    className={`min-w-[5.5rem] shrink-0 rounded-xl border px-2.5 py-2 text-center transition active:scale-95 ${
                      d.current ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border/60 bg-card hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-[10px] text-muted-foreground">{d.age}岁</p>
                    <p className={`font-serif-cn text-sm ${d.current ? "text-primary" : ""}`}>{d.gz}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{d.note}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {bookmarkedIds.length > 0 && (
            <Link to="/bookmarks" className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-dashed border-border/70 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50">
              <BookmarkCheck className="h-3.5 w-3.5" /> 查看已收藏流年
            </Link>
          )}
        </section>

        <Link to="/community" className="flex items-center gap-3 rounded-3xl bg-secondary/60 p-4">
          <Sparkles className="h-5 w-5 text-[var(--jade)]" />
          <div className="flex-1">
            <p className="text-sm font-medium">国学小科普 · 何为「枢」？</p>
            <p className="text-xs text-muted-foreground">天地之中曰枢，命理之机藏其内 →</p>
          </div>
        </Link>
      </div>

      {/* 五维详情弹窗 */}
      <Dialog open={!!openFortune} onOpenChange={(open) => !open && setOpenFortune(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-cn text-center">{activeFortune?.key}运 · 今日详解</DialogTitle>
            <DialogDescription className="text-center">
              <div className="mt-2 flex items-center justify-center gap-2">
                <ScoreBar score={(yunshiData ? {
                  "事业": yunshiData.yunshi_info.career_score,
                  "财运": yunshiData.yunshi_info.wealth_score,
                  "情感": yunshiData.yunshi_info.love_score,
                  "人际": yunshiData.yunshi_info.fortune_score,
                  "情绪": yunshiData.yunshi_info.health_score,
                }[openFortune || ""] : 60) || 60} color="var(--primary)" />
                <span className="text-xs text-muted-foreground">{
                  yunshiData ? ({
                    "事业": yunshiData.yunshi_info.career_score,
                    "财运": yunshiData.yunshi_info.wealth_score,
                    "情感": yunshiData.yunshi_info.love_score,
                    "人际": yunshiData.yunshi_info.fortune_score,
                    "情绪": yunshiData.yunshi_info.health_score,
                  }[openFortune || ""] || 60) : 60
                }分</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 text-sm leading-7 text-foreground/90">
            {/* AI 分析一句话 */}
            {aiAnalysis && openFortune && (
              <p className="mb-2 rounded-xl bg-primary/5 px-3 py-2 text-xs leading-5 text-primary/80">
                💡 {{
                  "事业": aiAnalysis.careerHint,
                  "财运": aiAnalysis.wealthHint,
                  "情感": aiAnalysis.loveHint,
                  "情绪": aiAnalysis.healthHint,
                  "人际": aiAnalysis.healthHint,
                }[openFortune] || ""}
              </p>
            )}
            {yunshiData && openFortune
              ? {
                  "事业": yunshiData.yunshi_info.career_description,
                  "财运": yunshiData.yunshi_info.wealth_description,
                  "情感": yunshiData.yunshi_info.love_description,
                  "人际": yunshiData.yunshi_info.fortune_description,
                  "情绪": yunshiData.yunshi_info.health_description,
                }[openFortune] || activeFortune?.detail
              : activeFortune?.detail}
          </div>
        </DialogContent>
      </Dialog>

      {/* 大运详解弹窗 */}
      <Dialog open={dayunDialogOpen} onOpenChange={setDayunDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-cn text-center">
              {dayunDialogData?.age}岁 · 大运「{dayunDialogData?.gz}」
            </DialogTitle>
            <DialogDescription className="text-center">
              {dayunDialogData?.god && <span className="text-primary">{dayunDialogData.god}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 text-sm leading-7 text-foreground/85 max-h-80 overflow-y-auto">
            {dayunAnalysisLoading ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-xs text-muted-foreground">AI 正在解读这段大运...</p>
              </div>
            ) : (
              <p className="whitespace-pre-line">{dayunAnalysisText || "暂无法获取分析"}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 角色切换弹窗 */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-cn">切换角色</DialogTitle>
            <DialogDescription>最多可保存 5 个角色档案</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => switchRole(r.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  r.id === activeId ? "border-primary bg-primary/5" : "border-border/60 bg-card"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl">{r.avatar || "🌿"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif-cn text-sm font-medium truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.gender} · {r.calendar === "农历" ? "农历" : ""}{r.birthDate} {r.birthTime}</p>
                </div>
                {r.id === activeId && <Check className="h-4 w-4 text-primary shrink-0" />}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id, r.name); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-[color-mix(in_oklab,var(--cinnabar)_10%,transparent)] hover:text-[var(--cinnabar)] transition-colors"
                  title={`删除 ${r.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
            {roles.length < 5 && (
              <Link
                to="/divine"
                onClick={() => setRoleOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3 text-sm text-primary"
              >
                <UserPlus className="h-4 w-4" /> 新增角色（{roles.length}/5）
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
