import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { FullAnalysis, FateChart } from "@/components/BaziReport";
import { ElementLandscape } from "@/components/ElementLandscape";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronLeft, Bookmark, Sparkles, Briefcase, Coins,
  HeartHandshake, Activity, ShoppingBag, Loader2,
} from "lucide-react";
import type { PaipanData, CesuanData } from "@/lib/api/yuanfenju.types";
import { analyzeDayunDetail } from "@/lib/api/fortune-analysis.functions";

export const Route = createFileRoute("/chart")({
  head: () => ({
    meta: [
      { title: "命盘结果 · 云枢易馆" },
      { name: "description", content: "八字四柱可视化命盘，五行强弱与命格标签一目了然。" },
    ],
  }),
  component: ChartPage,
});

// ==================== 数据映射工具函数 ====================

function parseBazi(baziRaw: string | string[]): string[] {
  if (Array.isArray(baziRaw)) return baziRaw;
  return baziRaw.split(/\s+/).filter(Boolean);
}

function parseShensha(shenshaStr: string | undefined): { name: string; desc: string }[] {
  if (!shenshaStr) return [];
  return shenshaStr.split(/\s+/).filter(Boolean).map((s) => ({ name: s, desc: "" }));
}

const shenshaLabelMap: Record<string, string> = {
  "天乙贵人": "一生贵人扶持，遇险呈祥",
  "文昌星": "利读书、考试、写作",
  "文昌贵人": "利读书、考试、写作",
  "驿马": "主动迁、出差、远行机会多",
  "桃花": "人缘佳，亦防口舌纠葛",
  "红鸾": "姻缘喜气，桃花正旺",
  "国印贵人": "文书权力，官方认可",
  "太极贵人": "悟性超凡，利学术研究",
  "福星贵人": "福气满满，一生少大灾",
  "月德贵人": "逢凶化吉，女命尤贵",
  "天德贵人": "福德深厚，遇难成祥",
  "德秀贵人": "才德兼备，品貌不俗",
  "禄神": "食禄丰足，生活无忧",
  "将星": "领导才能，统御一方",
  "华盖": "聪慧孤高，利艺术玄学",
  "金舆": "车马之贵，出行利顺",
  "天厨贵人": "饮食丰盛，口福不浅",
  "空亡": "虚空不定，宜守不宜攻",
  "劫煞": "意外波折，需防小人",
  "亡神": "心神不定，宜安定内守",
  "羊刃": "刚强锋利，宜以柔克刚",
  "飞刃": "飞来横祸，宜谨慎行事",
  "血刃": "手术血光，宜定期体检",
  "元辰": "本命气场，多思多虑",
  "十灵日": "灵性通透，直觉敏锐",
  "天罗": "困局难出，需借外力",
  "地网": "受制于人，宜低调蓄力",
  "日德": "品格端方，人缘良好",
  "进神": "开拓进取，宜新不宜旧",
  "流霞": "酒色诱惑，宜洁身自好",
  "天罗地网": "困局重重，需破而后立",
  "干禄": "正禄到位，事业稳定",
  "披麻": "家中琐事，关注长辈健康",
  "天医": "医学缘分，或需调养身体",
};

function formatShenshaList(shensha: Record<string, string>): { name: string; pos: string; desc: string }[] {
  const result: { name: string; pos: string; desc: string }[] = [];
  const labels: Record<string, string> = { year: "年支", month: "月支", day: "日支", hour: "时支" };
  for (const [key, val] of Object.entries(shensha)) {
    const pos = labels[key] || key;
    const names = parseShensha(val);
    for (const n of names) {
      if (!result.find((r) => r.name === n.name)) {
        result.push({ name: n.name, pos, desc: shenshaLabelMap[n.name] || "" });
      }
    }
  }
  // 去重，保留名字 + 合并位置
  const merged: { name: string; pos: string; desc: string }[] = [];
  for (const item of result) {
    const existing = merged.find((m) => m.name === item.name);
    if (existing) {
      existing.pos += "、" + item.pos;
    } else {
      merged.push(item);
    }
  }
  return merged.slice(0, 8); // 最多显示 8 个神煞
}

// 天干 → 五行映射
const GAN_WUXING: Record<string, { element: string; color: string; label: string }> = {
  "甲": { element: "木", color: "#4a9e6e", label: "甲木" },
  "乙": { element: "木", color: "#5db87a", label: "乙木" },
  "丙": { element: "火", color: "#d94e3c", label: "丙火" },
  "丁": { element: "火", color: "#e8685a", label: "丁火" },
  "戊": { element: "土", color: "#c49a3c", label: "戊土" },
  "己": { element: "土", color: "#d4a84a", label: "己土" },
  "庚": { element: "金", color: "#b8b8c0", label: "庚金" },
  "辛": { element: "金", color: "#c8c8d0", label: "辛金" },
  "壬": { element: "水", color: "#5a8ec9", label: "壬水" },
  "癸": { element: "水", color: "#6a9ed9", label: "癸水" },
};

// 地支 → 五行映射
const ZHI_WUXING: Record<string, { element: string; color: string; label: string }> = {
  "寅": { element: "木", color: "#4a9e6e", label: "寅木" },
  "卯": { element: "木", color: "#5db87a", label: "卯木" },
  "巳": { element: "火", color: "#d94e3c", label: "巳火" },
  "午": { element: "火", color: "#e8685a", label: "午火" },
  "辰": { element: "土", color: "#c49a3c", label: "辰土" },
  "戌": { element: "土", color: "#c49a3c", label: "戌土" },
  "丑": { element: "土", color: "#c49a3c", label: "丑土" },
  "未": { element: "土", color: "#c49a3c", label: "未土" },
  "申": { element: "金", color: "#b8b8c0", label: "申金" },
  "酉": { element: "金", color: "#c8c8d0", label: "酉金" },
  "亥": { element: "水", color: "#5a8ec9", label: "亥水" },
  "子": { element: "水", color: "#6a9ed9", label: "子水" },
};

function getGanInfo(gan: string) {
  return GAN_WUXING[gan] || { element: "", color: "var(--muted-foreground)", label: gan };
}

function getZhiInfo(zhi: string) {
  return ZHI_WUXING[zhi] || { element: "", color: "var(--muted-foreground)", label: zhi };
}

function getElementColor(name: string): string {
  const colors: Record<string, string> = {
    "木": "var(--jade)",
    "火": "var(--cinnabar)",
    "土": "var(--gold)",
    "金": "oklch(0.7 0.02 250)",
    "水": "oklch(0.5 0.08 230)",
  };
  return colors[name] || "var(--muted-foreground)";
}

interface ChartFormData {
  gender: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  calendar: string;
}

// 从八字排盘数据计算五行分数
function computeElementScores(paipanData: PaipanData): { wood: number; fire: number; earth: number; metal: number; water: number } {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const ganWx: Record<string, keyof typeof scores> = {
    "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth", "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water",
  };
  const zhiWx: Record<string, keyof typeof scores> = {
    "寅": "wood", "卯": "wood", "巳": "fire", "午": "fire",
    "辰": "earth", "戌": "earth", "丑": "earth", "未": "earth",
    "申": "metal", "酉": "metal", "亥": "water", "子": "water",
  };

  const di = paipanData.detail_info;
  // 四柱天干 + 地支
  if (di?.sizhu) {
    for (const key of ["year", "month", "day", "hour"] as const) {
      const p = di.sizhu[key];
      if (ganWx[p.tg]) scores[ganWx[p.tg]] += 15;
      if (zhiWx[p.dz]) scores[zhiWx[p.dz]] += 10;
    }
  }
  // 藏干（每柱藏干加权）
  if (di?.canggan) {
    for (const key of ["year", "month", "day", "hour"] as const) {
      const cg = di.canggan[key] || [];
      cg.forEach((g: string) => {
        const wx = ganWx[g];
        if (wx) scores[wx] += 5;
      });
    }
  }

  // 也尝试从 cesuan 缓存获取更准确的分数
  try {
    const cached = localStorage.getItem("yunshu:last-cesuan");
    if (cached) {
      const c = JSON.parse(cached);
      if (c.xiyongshen) {
        const x = c.xiyongshen;
        scores.wood = x.mu_score || scores.wood;
        scores.fire = x.huo_score || scores.fire;
        scores.earth = x.tu_score || scores.earth;
        scores.metal = x.jin_score || scores.metal;
        scores.water = x.shui_score || scores.water;
      }
    }
  } catch { /* ignore */ }

  // 确保最小值
  scores.wood = Math.max(5, scores.wood);
  scores.fire = Math.max(5, scores.fire);
  scores.earth = Math.max(5, scores.earth);
  scores.metal = Math.max(5, scores.metal);
  scores.water = Math.max(5, scores.water);

  return scores;
}

function ChartPage() {
  const [tab, setTab] = useState<"basic" | "pro">("basic");
  const [dayunDialogOpen, setDayunDialogOpen] = useState(false);
  const [dayunDialogData, setDayunDialogData] = useState<{ gz: string; god: string; age: string } | null>(null);
  const [dayunAnalysis, setDayunAnalysis] = useState("");
  const [dayunLoading, setDayunLoading] = useState(false);

  const handleDayunClick = async (gz: string, god: string, age: string) => {
    setDayunDialogData({ gz, god, age });
    setDayunDialogOpen(true);
    setDayunAnalysis("");
    setDayunLoading(true);

    const di = paipanData?.detail_info;
    const bsi = paipanData?.base_info;
    const sizhu = di?.sizhu;
    const sizhuStr = sizhu ? `${sizhu.year.tg}${sizhu.year.dz} ${sizhu.month.tg}${sizhu.month.dz} ${sizhu.day.tg}${sizhu.day.dz} ${sizhu.hour.tg}${sizhu.hour.dz}` : "";
    const cesuanCache = (() => { try { const c = localStorage.getItem("yunshu:last-cesuan"); return c ? JSON.parse(c) : null; } catch { return null; } })();

    try {
      const r = await analyzeDayunDetail({
        data: {
          name: bsi?.name || "用户",
          gender: bsi?.sex || "",
          dayunGz: gz,
          dayunGod: god,
          ageRange: age,
          rizhu: sizhu ? `${sizhu.day.tg}${sizhu.day.dz}日元` : "",
          zhengge: bsi?.zhengge || "",
          xiyongshen: cesuanCache?.xiyongshen?.xiyongshen || "",
          sizhu: sizhuStr,
        },
      });
      if (r.success) setDayunAnalysis(r.analysis);
      else setDayunAnalysis("AI 分析暂不可用");
    } catch {
      setDayunAnalysis("网络错误，请稍后重试");
    } finally {
      setDayunLoading(false);
    }
  };

  // 从 router state 读取排盘数据，回退到 localStorage
  const locationState = useRouterState({
    select: (s) => s.location.state,
  }) as { paipanData?: PaipanData; cesuanData?: CesuanData; formData?: ChartFormData } | undefined;

  // router state 优先，其次从 localStorage 恢复
  const paipanData = locationState?.paipanData || (() => {
    try {
      const cached = localStorage.getItem("yunshu:last-paipan");
      return cached ? JSON.parse(cached) as PaipanData : undefined;
    } catch { return undefined; }
  })();

  const formData = locationState?.formData;

  // 如果没有数据，显示引导
  if (!paipanData) {
    return (
      <MobileShell>
        <header className="flex items-center justify-between px-5 pt-10">
          <Link to="/divine" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <p className="font-serif-cn text-base font-medium">我的命盘</p>
          <span className="w-9" />
        </header>
        <div className="flex flex-col items-center justify-center px-5 pt-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="mt-5 font-serif-cn text-lg">尚未排盘</p>
          <p className="mt-2 text-sm text-muted-foreground">请先录入生辰信息，生成您的专属命盘</p>
          <Link
            to="/divine"
            className="mt-6 rounded-2xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-floating"
          >
            开始测算 →
          </Link>
        </div>
      </MobileShell>
    );
  }

  const { detail_info: di, bazi_info: bi, dayun_info: dyi, start_info: si, base_info: bsi } = paipanData;

  // 四柱数据（含五行颜色）
  const pillars = [
    { label: "年柱", gan: di.sizhu.year.tg, zhi: di.sizhu.year.dz,
      ganInfo: getGanInfo(di.sizhu.year.tg), zhiInfo: getZhiInfo(di.sizhu.year.dz),
      hidden: (di.canggan.year || []).join(""), shishen: di.zhuxing.year || "", nayin: di.nayin.year || "", tag: "" },
    { label: "月柱", gan: di.sizhu.month.tg, zhi: di.sizhu.month.dz,
      ganInfo: getGanInfo(di.sizhu.month.tg), zhiInfo: getZhiInfo(di.sizhu.month.dz),
      hidden: (di.canggan.month || []).join(""), shishen: di.zhuxing.month || "", nayin: di.nayin.month || "", tag: "" },
    { label: "日柱", gan: di.sizhu.day.tg, zhi: di.sizhu.day.dz,
      ganInfo: getGanInfo(di.sizhu.day.tg), zhiInfo: getZhiInfo(di.sizhu.day.dz),
      hidden: (di.canggan.day || []).join(""), shishen: di.zhuxing.day || "日元", nayin: di.nayin.day || "", tag: "日元" },
    { label: "时柱", gan: di.sizhu.hour.tg, zhi: di.sizhu.hour.dz,
      ganInfo: getGanInfo(di.sizhu.hour.tg), zhiInfo: getZhiInfo(di.sizhu.hour.dz),
      hidden: (di.canggan.hour || []).join(""), shishen: di.zhuxing.hour || "", nayin: di.nayin.hour || "", tag: "" },
  ];

  // 大运数据
  const dayun = dyi.big.map((gz, i) => ({
    age: dyi.xu_sui?.[i] ? `${dyi.xu_sui[i]}-${(dyi.xu_sui[i] || 0) + 9}` : `${8 + i * 10}-${17 + i * 10}`,
    gz,
    note: dyi.big_god?.[i] || "",
    hot: i === 2 || i === 3,
  })).slice(0, 6);

  // 流年数据 — 解析增强后的 year_char: "2026年（丙午·正财）"
  const currentYear = new Date().getFullYear();
  const currentDayunIdx = dyi.big_start_year
    ? dyi.big_start_year.findIndex((y: number) => y <= currentYear && (dyi.big_end_year?.[dyi.big_start_year.indexOf(y)] || 9999) >= currentYear)
    : -1;
  const liunianKey = `years_info${currentDayunIdx >= 0 ? currentDayunIdx : 3}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liunianData = (dyi as any)[liunianKey] as { year_char: string }[] | undefined;

  const liunian = (liunianData || []).slice(0, 6).map((y) => {
    const yearMatch = y.year_char.match(/^(\d+)年（(.+?)·(.+?)）$/);
    const yearNum = yearMatch ? parseInt(yearMatch[1]) : 0;
    const ganzhi = yearMatch ? yearMatch[2] : "";
    const desc = yearMatch ? yearMatch[3] : "";
    const isCurrent = yearNum === currentYear;
    return {
      year: yearMatch ? `${yearNum}年` : y.year_char,
      ganzhi,
      luck: isCurrent ? "当前" : (desc || "流年"),
      text: yearMatch
        ? `${yearNum}年流年「${ganzhi}」· 十神「${desc}」。${getLiunianHint(desc, ganzhi)}`
        : "",
    };
  });

  function getLiunianHint(desc: string, gz: string): string {
    const hints: Record<string, string> = {
      "比肩": "同辈助力，宜合作共赢，但也需注意竞争关系。",
      "劫财": "人际活跃，开销增多，宜理性消费，谨防破财。",
      "食神": "创意迸发，适合学习新技能或开启副业，心情愉悦。",
      "伤官": "才思敏捷，言语表达能力强，但需注意口舌是非。",
      "正财": "正财运佳，适合稳扎稳打的投资，收入稳定增长。",
      "偏财": "偏财运旺，可能有意外之财，但风险与机遇并存。",
      "正官": "事业运上升，容易获得认可，适合争取晋升。",
      "七杀": "挑战与机遇并存，压力即动力，突破自我之年。",
      "正印": "贵人运强，学习进修的好时机，身心滋养。",
      "偏印": "独立思考能力强，适合深耕专业领域，但需注意人际关系。",
    };
    return hints[desc] || "运势流转，把握当下，顺势而为。";
  }

  // 神煞
  const shensha = formatShenshaList(di.shensha);

  // 命名
  const rizhuGan = di.sizhu.day.tg;
  const rizhuZhi = di.sizhu.day.dz;
  const rizhuLabel = `${rizhuGan}${rizhuZhi}日元`;

  // 纳音
  const overallNayin = Object.values(di.nayin).join(" · ");

  // 五行能量环 — 从 cesuan 数据获取会更好，这里用简化版
  const elementsDefault = [
    { name: "木", value: 25, color: "var(--jade)" },
    { name: "火", value: 20, color: "var(--cinnabar)" },
    { name: "土", value: 25, color: "var(--gold)" },
    { name: "金", value: 20, color: "oklch(0.7 0.02 250)" },
    { name: "水", value: 10, color: "oklch(0.5 0.08 230)" },
  ];

  // 格局
  const zhengge = bsi?.zhengge || "";

  // 喜用神（如果有 cesuan 数据则从那里获取）
  const xiyongshenStr = "";

  // 星座生肖
  const xingzuo = si?.xz || "";
  const shengxiao = si?.sx || "";

  // 吉神
  const jishenTags = si?.jishen || [];

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <Link to="/divine" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">我的命盘</p>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft text-muted-foreground">
          <Bookmark className="h-4 w-4" />
        </button>
      </header>

      <div className="px-5 pt-5 pb-8">
        {/* 命盘头部 */}
        <div className="scroll-paper rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif-cn text-lg">{rizhuLabel} · {rizhuGan}土载木</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pillars.map((p) => `${p.gan}${p.zhi}`).join(" / ")}
              </p>
              {/* 日期换算显示 */}
              {formData?.calendar === "农历" && bsi?.gongli && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  📅 农历 {formData.birthDate} → 公历 <span className="text-primary font-medium">{bsi.gongli}</span>
                </p>
              )}
              {formData?.calendar !== "农历" && formData?.birthDate && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  📅 公历 {formData.birthDate}{bsi?.nongli ? ` · 农历 ${bsi.nongli}` : ""}
                </p>
              )}
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] text-primary">
              {shengxiao && `属${shengxiao}`}{xingzuo && ` · ${xingzuo}`}
            </span>
          </div>

          {/* 基础/专业切换 */}
          <div className="mt-4 inline-flex rounded-full bg-muted p-0.5 text-xs">
            {[
              { k: "basic", l: "基础排盘" },
              { k: "pro", l: "专业细盘" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as "basic" | "pro")}
                className={`rounded-full px-3 py-1.5 transition ${tab === t.k ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* 四柱 — 天干地支按行展示，五行用颜色区分 */}
          <div className="mt-4">
            {/* 列头 */}
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] gap-1.5 mb-1.5">
              <span />
              {pillars.map((p) => (
                <div key={p.label} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{p.label}</p>
                </div>
              ))}
            </div>
            {/* 天干行 */}
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] gap-1.5 mb-1.5">
              <span className="flex items-center justify-end text-[10px] text-muted-foreground pr-1">天干</span>
              {pillars.map((p) => (
                <div key={p.label} className="rounded-xl border border-border/60 bg-card/80 py-2.5 text-center relative">
                  <p className="font-serif-cn text-2xl font-bold" style={{ color: p.ganInfo.color }}>{p.gan}</p>
                  {p.tag && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">{p.tag}</span>
                  )}
                </div>
              ))}
            </div>
            {/* 地支行 */}
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] gap-1.5">
              <span className="flex items-center justify-end text-[10px] text-muted-foreground pr-1">地支</span>
              {pillars.map((p) => (
                <div key={p.label} className="rounded-xl border border-border/60 bg-card/80 py-2 text-center">
                  <p className="font-serif-cn text-xl font-bold" style={{ color: p.zhiInfo.color }}>{p.zhi}</p>
                </div>
              ))}
            </div>
            {tab === "pro" && (
              <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] gap-1.5 mt-1.5">
                <span className="flex items-center justify-end text-[9px] text-muted-foreground pr-1">十神</span>
                {pillars.map((p) => (
                  <div key={p.label} className="text-center">
                    <p className="text-[9px] text-primary/80 font-medium">{p.shishen}</p>
                    {p.hidden && <p className="text-[9px] text-muted-foreground leading-tight">藏：{p.hidden}</p>}
                    <p className="text-[9px] text-muted-foreground leading-tight">{p.nayin}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 五行颜色图例 */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            {["木","火","土","金","水"].map((wx) => (
              <span key={wx} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: getElementColor(wx) }} />
                {wx}
              </span>
            ))}
          </div>

          {tab === "pro" && (
            <div className="mt-3 rounded-2xl bg-muted/40 p-3 text-[11px] leading-5 text-foreground/80">
              <p>• 格局：{zhengge || "—"}</p>
              <p>• 纳音：{overallNayin || "—"}</p>
              <p>• 日主：{rizhuGan}土 坐{rizhuZhi}库</p>
              {xiyongshenStr && <p>• 喜用神：{xiyongshenStr}</p>}
              {jishenTags.length > 0 && <p>• 吉神：{jishenTags.join("、")}</p>}
            </div>
          )}
        </div>

        {/* 五行 */}
        <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-serif-cn text-sm font-medium">五行强弱</p>
            <span className="text-[11px] text-muted-foreground">{xiyongshenStr || "数据基于排盘"}</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {elementsDefault.map((e) => (
              <div key={e.name} className="flex items-center gap-3">
                <span className="w-5 font-serif-cn text-sm" style={{ color: e.color }}>{e.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${e.value}%`, background: e.color }} />
                </div>
                <span className="w-8 text-right text-xs text-muted-foreground">{e.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 大运 */}
        <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-serif-cn text-sm font-medium">大运排布（点击查看详解）</p>
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1">
            {dayun.map((d) => (
              <button
                key={d.age}
                onClick={() => handleDayunClick(d.gz, d.note, d.age)}
                className={`min-w-[7.5rem] shrink-0 rounded-2xl border p-3 text-left transition active:scale-95 ${
                  d.hot ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border/60 bg-card hover:bg-muted/50"
                }`}
              >
                <p className="text-[10px] text-muted-foreground">{d.age} 岁</p>
                <p className="mt-0.5 font-serif-cn text-base text-primary">{d.gz}</p>
                <p className="mt-1 text-[11px] leading-4 text-foreground/80">{d.note}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 大运解读弹窗 */}
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
              {dayunLoading ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">AI 正在解读这段大运...</p>
                </div>
              ) : (
                <p className="whitespace-pre-line">{dayunAnalysis || "暂无法获取分析"}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 流年 */}
        {liunian.length > 0 && (
          <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
            <p className="font-serif-cn text-sm font-medium">流年运势 · 逐年详解</p>
            <div className="mt-3 space-y-3">
              {liunian.map((l) => (
                <div key={l.year} className="flex items-start gap-3 border-l-2 border-primary/40 pl-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{l.year}</p>
                      <span className="text-[11px] text-muted-foreground">{l.ganzhi}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${l.luck === "当前" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {l.luck}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-foreground/75">{l.text || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 神煞 */}
        {shensha.length > 0 && (
          <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
            <p className="font-serif-cn text-sm font-medium">神煞速览</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {shensha.map((s) => (
                <div key={s.name} className="rounded-2xl bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-serif-cn text-sm text-primary">{s.name}</p>
                    <span className="text-[10px] text-muted-foreground">{s.pos}</span>
                  </div>
                  {s.desc && <p className="mt-1 text-[11px] leading-4 text-foreground/80">{s.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 命格标签 */}
        {(jishenTags.length > 0 || zhengge) && (
          <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
            <p className="font-serif-cn text-sm font-medium">命格标签</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {jishenTags.slice(0, 5).map((t) => (
                <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs">{t}</span>
              ))}
              {zhengge && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{zhengge}</span>}
            </div>
          </section>
        )}

        {/* 生活建议速览 */}
        <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="font-serif-cn text-sm font-medium">多场景命理速读</p>
            <Link to="/reading" state={{ paipanData, formData } as any} className="text-[11px] text-primary">详细解读 →</Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { icon: Briefcase, title: "事业", tone: "text-primary bg-primary/10" },
              { icon: Coins, title: "财运", tone: "text-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_15%,transparent)]" },
              { icon: HeartHandshake, title: "情感", tone: "text-[var(--cinnabar)] bg-[color-mix(in_oklab,var(--cinnabar)_12%,transparent)]" },
              { icon: Activity, title: "健康", tone: "text-[var(--jade)] bg-[color-mix(in_oklab,var(--jade)_12%,transparent)]" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  to="/reading"
                  state={{ paipanData, formData } as any}
                  key={s.title}
                  className="rounded-2xl border border-border/60 p-3 active:scale-[0.98]"
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="mt-2 font-serif-cn text-sm">{s.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">点击查看 AI 详解 →</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 开运手串推荐 */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-[color-mix(in_oklab,var(--gold)_10%,transparent)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-primary shadow-soft">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-serif-cn text-sm font-medium">AI 开运手串推荐</p>
                <p className="text-[11px] text-muted-foreground">基于命盘喜用神智能推荐</p>
              </div>
            </div>
          </div>
          <Link
            to="/shop"
            search={{ element: xiyongshenStr || "金水" }}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-medium text-primary-foreground shadow-floating"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> 进入开运商城
          </Link>
        </div>

        {/* 五行命理风景图 */}
        <ElementLandscape
          scores={computeElementScores(paipanData)}
          sizhuStr={pillars.map((p) => `${p.gan}${p.zhi}`).join(" ")}
          rizhu={`${di.sizhu.day.tg}${di.sizhu.day.dz}日元`}
          zhengge={zhengge || ""}
          name={formData ? (bsi?.name || "用户") : "用户"}
        />

        {/* 完整分析报告 */}
        <FullAnalysis paipanData={paipanData} />

        {/* 命理图 */}
        <FateChart paipanData={paipanData} formData={formData} />
      </div>
    </MobileShell>
  );
}
