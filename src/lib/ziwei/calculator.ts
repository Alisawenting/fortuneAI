// ==================== 紫微斗数计算引擎 ====================
// 基于 iztro 封装，输出简化的 ZiweiChartData
import { astro } from "iztro";
import type { ZiweiChartData, ZiweiPalace, ZiweiInput } from "./types";

/** 时间 "HH:MM" → iztro timeIndex (0-12) */
function timeToIndex(time: string): number {
  const h = parseInt(time.split(":")[0], 10);
  if (h === 23) return 12;  // 晚子时
  return Math.floor(((h + 1) % 24) / 2);  // 0→早子, 1→丑, 2→寅, ...
}

/** 紫微斗数排盘 — 公历 */
export function computeZiweiSolar(input: ZiweiInput): ZiweiChartData {
  const timeIndex = timeToIndex(input.birthTime);
  const chart = astro.bySolar(input.birthDate, timeIndex, input.gender, true, "zh-CN");
  return mapChart(chart);
}

/** 紫微斗数排盘 — 农历 */
export function computeZiweiLunar(input: ZiweiInput): ZiweiChartData {
  const timeIndex = timeToIndex(input.birthTime);
  const chart = astro.byLunar(input.birthDate, timeIndex, input.gender, input.isLeapMonth, true, "zh-CN");
  return mapChart(chart);
}

/** 紫微斗数排盘 — 自动判断历法 */
export function computeZiwei(input: ZiweiInput): ZiweiChartData {
  if (input.calendar === "农历") {
    return computeZiweiLunar(input);
  }
  return computeZiweiSolar(input);
}

/** 将 iztro 返回的原始星盘 → 简化数据结构 */
function mapChart(chart: ReturnType<typeof astro.bySolar>): ZiweiChartData {
  const palaces: ZiweiPalace[] = chart.palaces.map((p) => ({
    index: p.index,
    name: p.name,
    isBodyPalace: p.isBodyPalace,
    isOriginalPalace: p.isOriginalPalace,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    majorStars: p.majorStars.map((s: { name: string }) => s.name),
    minorStars: p.minorStars.map((s: { name: string }) => s.name),
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
    decadalRange: p.decadal?.range || [0, 0],
    decadalHeavenlyStem: p.decadal?.heavenlyStem || "",
    decadalEarthlyBranch: p.decadal?.earthlyBranch || "",
    ages: p.ages || [],
  }));

  return {
    gender: chart.gender,
    solarDate: chart.solarDate,
    lunarDate: chart.lunarDate,
    chineseDate: chart.chineseDate,
    time: chart.time,
    timeRange: chart.timeRange,
    sign: chart.sign,
    zodiac: chart.zodiac,
    soulPalace: chart.earthlyBranchOfSoulPalace,
    bodyPalace: chart.earthlyBranchOfBodyPalace,
    soul: chart.soul,
    body: chart.body,
    fiveElementsClass: chart.fiveElementsClass,
    palaces,
  };
}
