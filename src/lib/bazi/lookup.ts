// ==================== 八字查表数据 ====================
// 袁天罡称骨 / 纳音 / 藏干 / 十神 / 神煞 / 五行规则

// ── 天干/地支/五行基础 ──

export const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const WU_XING_LIST = ["木", "火", "土", "金", "水"] as const;

export type Tiangan = (typeof TIAN_GAN)[number];
export type Dizhi = (typeof DI_ZHI)[number];
export type Wuxing = (typeof WU_XING_LIST)[number];

/** 天干 → 五行 */
export const GAN_WUXING: Record<string, Wuxing> = {
  "甲": "木", "乙": "木",
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
};

/** 天干 → 阴阳 (1=阳, 0=阴) */
export const GAN_YINYANG: Record<string, number> = {
  "甲": 1, "丙": 1, "戊": 1, "庚": 1, "壬": 1,
  "乙": 0, "丁": 0, "己": 0, "辛": 0, "癸": 0,
};

/** 地支 → 五行 */
export const ZHI_WUXING: Record<string, Wuxing> = {
  "寅": "木", "卯": "木",
  "巳": "火", "午": "火",
  "辰": "土", "戌": "土", "丑": "土", "未": "土",
  "申": "金", "酉": "金",
  "亥": "水", "子": "水",
};

/** 地支 → 藏干 (本气/中气/余气) */
export const ZHI_CANGGAN: Record<string, string[]> = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"],
};

/** 地支 → 对应时辰名 */
export const ZHI_HOUR_NAMES: Record<string, string> = {
  "子": "子时 (23:00-00:59)", "丑": "丑时 (01:00-02:59)",
  "寅": "寅时 (03:00-04:59)", "卯": "卯时 (05:00-06:59)",
  "辰": "辰时 (07:00-08:59)", "巳": "巳时 (09:00-10:59)",
  "午": "午时 (11:00-12:59)", "未": "未时 (13:00-14:59)",
  "申": "申时 (15:00-16:59)", "酉": "酉时 (17:00-18:59)",
  "戌": "戌时 (19:00-20:59)", "亥": "亥时 (21:00-22:59)",
};

/** 时辰 → 地支 (按2小时一段) */
export function hourToZhi(hour: number): string {
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return DI_ZHI[idx];
}

// ── 纳音 (60甲子 → 30纳音) ──

const NAYIN_30 = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火",
  "涧下水", "城头土", "白蜡金", "杨柳木", "井泉水", "屋上土",
  "霹雳火", "松柏木", "流年水", "砂中金", "山下火", "平地木",
  "壁上土", "金箔金", "覆灯火", "天河水", "大驿土", "钗钏金",
  "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水",
];

/** 获取干支的纳音 (甲子起计，每对干支顺序排列) */
export function getNayin(ganZhi: string): string {
  // 60甲子中第几个
  const ganIdx = TIAN_GAN.indexOf(ganZhi[0] as Tiangan);
  const zhiIdx = DI_ZHI.indexOf(ganZhi[1] as Dizhi);
  if (ganIdx === -1 || zhiIdx === -1) return "";
  // 甲子 = index 0 → nayin[0], 乙丑 = index 1 → nayin[0], 丙寅 = 2 → nayin[1]
  const cycleIdx = (ganIdx * 6 + (zhiIdx - ganIdx + 12) % 12 / 2) % 30;
  // 简化：按60甲子序号
  const jiaziIdx = (ganIdx % 2 === zhiIdx % 2)
    ? ((ganIdx * 6 + (zhiIdx + 12 - ganIdx) % 12 / 2) + 30) % 60
    : -1;
  // 实际：甲子到癸亥，第n对
  const n = Math.floor(((ganIdx * 6) % 60 + zhiIdx) / 2);
  const idx = Math.floor((ganIdx * 6 + zhiIdx) / 2) % 30;
  return NAYIN_30[idx] || "";
}

/** 精确纳音 (基于干支在60周期中的顺序) */
export function getNayinExact(ganZhi: string): string {
  const g = ganZhi[0];
  const z = ganZhi[1];
  const gIdx = TIAN_GAN.indexOf(g as Tiangan);
  const zIdx = DI_ZHI.indexOf(z as Dizhi);
  if (gIdx === -1 || zIdx === -1) return "";
  // 60甲子序号: 甲子=0, 乙丑=1, ..., 癸亥=59
  // 只有天干地支同奇偶才能配对
  const jzIdx = (gIdx * 6 + Math.floor(zIdx / 2)) % 60;
  return NAYIN_30[Math.floor(jzIdx / 2)];
}

// ── 十神计算 ──

/** 天干 → 十神名称 (日干 vs 目标干) */
export function getShiShen(rizhuGan: string, targetGan: string): string {
  const wxMap: Record<string, string> = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火",
    "戊": "土", "己": "土", "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
  };
  const yinYang = (g: string) => ["甲","丙","戊","庚","壬"].includes(g) ? 1 : 0;
  const riWx = wxMap[rizhuGan];
  const tgWx = wxMap[targetGan];
  const riYy = yinYang(rizhuGan);
  const tgYy = yinYang(targetGan);

  // 同五行
  if (riWx === tgWx) {
    return riYy === tgYy ? "比肩" : "劫财";
  }
  // 我生
  if (
    (riWx === "木" && tgWx === "火") ||
    (riWx === "火" && tgWx === "土") ||
    (riWx === "土" && tgWx === "金") ||
    (riWx === "金" && tgWx === "水") ||
    (riWx === "水" && tgWx === "木")
  ) {
    return riYy === tgYy ? "食神" : "伤官";
  }
  // 我克
  if (
    (riWx === "木" && tgWx === "土") ||
    (riWx === "火" && tgWx === "金") ||
    (riWx === "土" && tgWx === "水") ||
    (riWx === "金" && tgWx === "木") ||
    (riWx === "水" && tgWx === "火")
  ) {
    return riYy === tgYy ? "偏财" : "正财";
  }
  // 生我
  if (
    (tgWx === "木" && riWx === "火") ||
    (tgWx === "火" && riWx === "土") ||
    (tgWx === "土" && riWx === "金") ||
    (tgWx === "金" && riWx === "水") ||
    (tgWx === "水" && riWx === "木")
  ) {
    return riYy === tgYy ? "偏印" : "正印";
  }
  // 克我
  return riYy === tgYy ? "七杀" : "正官";
}

/** 天干序列中获取十神名 */
export function getShishenNames(rizhuGan: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const g of TIAN_GAN) {
    result[g] = getShiShen(rizhuGan, g);
  }
  return result;
}

// ── 称骨查表 ──

/** 年干支 → 重量(钱) */
export const CHENGGU_YEAR: Record<string, number> = {
  "甲子": 12, "乙丑": 9,  "丙寅": 6,  "丁卯": 7,  "戊辰": 12, "己巳": 5,
  "庚午": 9,  "辛未": 8,  "壬申": 7,  "癸酉": 8,  "甲戌": 15, "乙亥": 9,
  "丙子": 16, "丁丑": 8,  "戊寅": 8,  "己卯": 19, "庚辰": 12, "辛巳": 6,
  "壬午": 8,  "癸未": 7,  "甲申": 5,  "乙酉": 15, "丙戌": 6,  "丁亥": 16,
  "戊子": 15, "己丑": 7,  "庚寅": 9,  "辛卯": 12, "壬辰": 10, "癸巳": 7,
  "甲午": 15, "乙未": 6,  "丙申": 5,  "丁酉": 14, "戊戌": 14, "己亥": 9,
  "庚子": 7,  "辛丑": 7,  "壬寅": 9,  "癸卯": 12, "甲辰": 8,  "乙巳": 7,
  "丙午": 13, "丁未": 5,  "戊申": 14, "己酉": 5,  "庚戌": 9,  "辛亥": 17,
  "壬子": 5,  "癸丑": 7,  "甲寅": 12, "乙卯": 8,  "丙辰": 8,  "丁巳": 6,
  "戊午": 19, "己未": 6,  "庚申": 8,  "辛酉": 16, "壬戌": 10, "癸亥": 7,
};

/** 农历月 → 重量(钱) */
export const CHENGGU_MONTH: Record<number, number> = {
  1: 6, 2: 7, 3: 18, 4: 9, 5: 5, 6: 16,
  7: 9, 8: 15, 9: 18, 10: 8, 11: 9, 12: 5,
};

/** 农历日 → 重量(钱) */
export const CHENGGU_DAY: Record<number, number> = {
  1:5, 2:10, 3:8, 4:15, 5:16, 6:15, 7:8, 8:16, 9:8, 10:16,
  11:9, 12:17, 13:8, 14:17, 15:10, 16:8, 17:9, 18:18, 19:5, 20:15,
  21:10, 22:9, 23:8, 24:9, 25:15, 26:18, 27:7, 28:8, 29:16, 30:6,
};

/** 时辰 (地支) → 重量(钱) */
export const CHENGGU_HOUR: Record<string, number> = {
  "子": 16, "丑": 6, "寅": 7, "卯": 10,
  "辰": 9, "巳": 16, "午": 10, "未": 8,
  "申": 8, "酉": 9, "戌": 6, "亥": 6,
};

/** 称骨总重 → 判词 (钱) */
export function getChengguDesc(totalQian: number): { weight: string; desc: string } {
  const liang = Math.floor(totalQian / 10);
  const qian = totalQian % 10;
  const w = `${liang}两${qian}钱`;

  const descs: Record<number, string> = {
    20: "身寒骨冷苦伶仃，此命推来行乞人。劳劳碌碌无度日，终年打拱过平生。",
    21: "此命推来事不同，为人能干异凡庸。中年还有逍遥福，不比前时运未通。",
    22: "此命推来骨肉轻，求谋作事事难成。妻儿兄弟应难许，别处他乡作散人。",
    23: "此命推来福不轻，自成自立显门庭。从来富贵人钦敬，使婢差奴过一生。",
    24: "此命推来福禄无，门庭困苦总难营。六亲骨肉皆无靠，流浪他乡作老翁。",
    25: "此命推来祖业微，门庭营度似稀奇。六亲骨肉如冰炭，一世勤劳自把持。",
    26: "平生衣禄苦中求，独自营谋事不休。离祖出门宜早计，晚来衣禄自无休。",
    27: "一生作事少商量，难靠祖宗作主张。独马单枪空做去，早年晚岁总无长。",
    28: "一生行事似飘蓬，祖宗产业在梦中。若不过房改名姓，也当移徒二三通。",
    29: "初年运限未曾亨，纵有功名在后成。须过四旬才可立，移居改姓始为良。",
    30: "劳劳碌碌苦中求，东奔西走何日休。若使终身勤与俭，老来稍可免忧愁。",
    31: "忙忙碌碌苦中求，何日云开见日头。难得祖基家可立，中年衣食渐无忧。",
    32: "初年运蹇事难谋，渐有财源如水流。到得中年衣食旺，那时名利一齐收。",
    33: "早年做事事难成，百计徒劳枉费心。半世自如流水去，后来运到始得金。",
    34: "此命福气果如何，僧道门中衣禄多。离祖出家方为妙，朝晚拜佛念弥陀。",
    35: "生平福量不周全，祖业根基觉少传。营事生涯宜守旧，时来衣食胜从前。",
    36: "不须劳碌过平生，独自成家福不轻。早有福星常照命，任君行去百般成。",
    37: "此命般般事不成，弟兄少力自孤行。虽然祖业须微有，来得明时去不明。",
    38: "一身骨肉最清高，早入簧门姓氏标。待到年将三十六，蓝衫脱去换红袍。",
    39: "此命终身运不通，劳劳作事尽皆空。苦心竭力成家计，到得那时在梦中。",
    40: "平生衣禄是绵长，件件心中自主张。前面风霜多受过，后来必定享安康。",
    41: "此命推来自不同，为人能干异凡庸。中年还有逍遥福，不比前时运未通。",
    42: "得宽怀处且宽怀，何用双眉皱不开。若使中年命运济，那时名利一齐来。",
    43: "为人心性最聪明，作事轩昂近贵人。衣禄一生天注定，不须劳碌是丰亨。",
    44: "万事由天莫苦求，须知福禄命里收。少壮名利难如意，晚景欣然便不忧。",
    45: "名利推求竟若何，前番辛苦后奔波。命中难养男和女，骨肉扶持也不多。",
    46: "东西南北尽皆通，出姓移居更觉隆。衣禄无穷无数定，中年晚景一般同。",
    47: "此命推求旺末年，妻荣子贵自怡然。平生原有滔滔福，可卜财源若水泉。",
    48: "初年运道未曾通，几许蹉跎命亦穷。兄弟六亲无依靠，一生事业晚来隆。",
    49: "此命推来福不轻，自成自立显门庭。从来富贵人钦敬，使婢差奴过一生。",
    50: "为利为名终日劳，中年福禄也多遭。老来自有财星照，不比前番目下高。",
    51: "一世荣华事事通，不须劳碌自亨通。弟兄叔侄皆如意，家业成时福禄宏。",
    52: "一世亨通事事能，不须劳苦自然宁。宗族有光欣喜甚，家产丰盈自称心。",
    53: "此格推来福泽宏，兴家立业在其中。一生衣食安排定，却是人间一富翁。",
    54: "此命推来厚且清，诗书满腹看功成。丰衣足食自然稳，正是人间有福人。",
    55: "走马扬鞭争利名，少年做事费筹论。一朝福禄源源至，富贵荣华显六亲。",
    56: "此格推来礼义通，一身福禄用无穷。甜酸苦辣皆尝过，滚滚财源稳且丰。",
    57: "福禄丰盈万事全，一身荣耀乐天年。名扬威震人争羡，此世逍遥宛似仙。",
    58: "平生衣食自然来，名利双全富贵偕。金榜题名登甲第，紫袍玉带走金阶。",
    59: "细推此格秀而清，必定才高学业成。甲第之中应有分，扬鞭走马显威荣。",
    60: "此格推来是清贵，读书必定有文名。官居极品人臣上，万古流芳姓字馨。",
    61: "此命生来福不穷，读书必定显亲宗。紫衣金带为卿相，富贵荣华孰与同。",
  };

  const desc = descs[totalQian] || descs[42] || "福禄寿三星拱照，一生衣禄无忧。";
  return { weight: w, desc };
}

// ── 神煞规则 ──

/** 天干 → 天乙贵人地支 (日/年干查) */
const TIANYI_GUIREN: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "辛": ["午", "寅"], "壬": ["巳", "卯"], "癸": ["巳", "卯"],
};

/** 日干 → 文昌贵人地支 */
const WENCHANG: Record<string, string> = {
  "甲": "巳", "乙": "午", "丙": "申", "丁": "酉",
  "戊": "申", "己": "酉", "庚": "亥", "辛": "子",
  "壬": "寅", "癸": "卯",
};

/** 日干 → 禄神地支 */
const LUSHEN: Record<string, string> = {
  "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午",
  "戊": "巳", "己": "午", "庚": "申", "辛": "酉",
  "壬": "亥", "癸": "子",
};

/** 日干 → 羊刃地支 */
const YANGREN: Record<string, string> = {
  "甲": "卯", "乙": "辰", "丙": "午", "丁": "未",
  "戊": "午", "己": "未", "庚": "酉", "辛": "戌",
  "壬": "子", "癸": "丑",
};

/** 年/日支 → 驿马地支 (三合局冲) */
const YIMA: Record<string, string> = {
  "申": "寅", "子": "寅", "辰": "寅",
  "寅": "申", "午": "申", "戌": "申",
  "巳": "亥", "酉": "亥", "丑": "亥",
  "亥": "巳", "卯": "巳", "未": "巳",
};

/** 年/日支 → 桃花地支 */
const TAOHUA: Record<string, string> = {
  "申": "酉", "子": "酉", "辰": "酉",
  "寅": "卯", "午": "卯", "戌": "卯",
  "巳": "午", "酉": "午", "丑": "午",
  "亥": "子", "卯": "子", "未": "子",
};

/** 年/日支 → 华盖地支 */
const HUAGAI: Record<string, string> = {
  "申": "辰", "子": "辰", "辰": "辰",
  "寅": "戌", "午": "戌", "戌": "戌",
  "巳": "丑", "酉": "丑", "丑": "丑",
  "亥": "未", "卯": "未", "未": "未",
};

/** 年/日支 → 将星地支 */
const JIANGXING: Record<string, string> = {
  "申": "子", "子": "子", "辰": "子",
  "寅": "午", "午": "午", "戌": "午",
  "巳": "酉", "酉": "酉", "丑": "酉",
  "亥": "卯", "卯": "卯", "未": "卯",
};

/** 月支 → 天德贵人天干 */
const TIANDE: Record<string, string> = {
  "寅": "丁", "卯": "申", "辰": "壬", "巳": "辛",
  "午": "亥", "未": "甲", "申": "癸", "酉": "寅",
  "戌": "丙", "亥": "乙", "子": "巳", "丑": "庚",
};

/** 月支 → 月德贵人天干 */
const YUEDE: Record<string, string> = {
  "寅": "丙", "卯": "甲", "辰": "壬", "巳": "庚",
  "午": "丙", "未": "甲", "申": "壬", "酉": "庚",
  "戌": "丙", "亥": "甲", "子": "壬", "丑": "庚",
};

/** 计算四柱神煞 */
export function computeShensha(
  sizhu: { year: { tg: string; dz: string }; month: { tg: string; dz: string }; day: { tg: string; dz: string }; hour: { tg: string; dz: string } },
): Record<string, string> {
  const result: Record<string, string> = { year: "", month: "", day: "", hour: "" };
  const pillars = ["year", "month", "day", "hour"] as const;

  const yearGan = sizhu.year.tg;
  const yearZhi = sizhu.year.dz;
  const dayGan = sizhu.day.tg;
  const dayZhi = sizhu.day.dz;
  const monthZhi = sizhu.month.dz;

  for (const p of pillars) {
    const parts: string[] = [];
    const pGan = sizhu[p].tg;
    const pZhi = sizhu[p].dz;

    // 天乙贵人 (日干查)
    if (TIANYI_GUIREN[dayGan]?.includes(pZhi)) parts.push("天乙贵人");
    // 文昌贵人 (日干查)
    if (WENCHANG[dayGan] === pZhi) parts.push("文昌星");
    // 禄神 (日干查)
    if (LUSHEN[dayGan] === pZhi) parts.push("禄神");
    // 羊刃 (日干查)
    if (YANGREN[dayGan] === pZhi) parts.push("羊刃");
    // 驿马 (年支 + 日支查)
    if (YIMA[yearZhi] === pZhi || YIMA[dayZhi] === pZhi) parts.push("驿马");
    // 桃花 (年支 + 日支查)
    if (TAOHUA[yearZhi] === pZhi || TAOHUA[dayZhi] === pZhi) parts.push("桃花");
    // 华盖 (年支 + 日支查)
    if (HUAGAI[yearZhi] === pZhi || HUAGAI[dayZhi] === pZhi) parts.push("华盖");
    // 将星 (年支 + 日支查)
    if (JIANGXING[yearZhi] === pZhi || JIANGXING[dayZhi] === pZhi) parts.push("将星");
    // 天德贵人 (月支查)
    if (TIANDE[monthZhi] === pGan) parts.push("天德贵人");
    // 月德贵人 (月支查)
    if (YUEDE[monthZhi] === pGan) parts.push("月德贵人");
    // 太极贵人 (日干+年干)
    if ((dayGan === "甲" || dayGan === "乙" || yearGan === "甲" || yearGan === "乙") && (pZhi === "子" || pZhi === "午")) parts.push("太极贵人");
    if ((dayGan === "丙" || dayGan === "丁" || yearGan === "丙" || yearGan === "丁") && (pZhi === "卯" || pZhi === "酉")) parts.push("太极贵人");
    if ((dayGan === "戊" || dayGan === "己" || yearGan === "戊" || yearGan === "己") && (pZhi === "辰" || pZhi === "戌" || pZhi === "丑" || pZhi === "未")) parts.push("太极贵人");
    // 福星贵人 (日干查)
    const FUXING: Record<string, string> = { "甲": "丑", "乙": "巳", "丙": "卯", "丁": "申", "庚": "午", "辛": "亥", "壬": "辰", "癸": "卯" };
    if (FUXING[dayGan] === pZhi || FUXING[dayGan] === pGan) parts.push("福星贵人");

    // 去重
    result[p] = [...new Set(parts)].join(" ");
  }

  return result;
}

// ── 格局判断 ──

/** 根据月支 + 日干判断格局 */
export function getZhengge(monthZhi: string, dayGan: string): string {
  const wxGan = GAN_WUXING[dayGan];
  const wxZhi = ZHI_WUXING[monthZhi];
  const yyGan = GAN_YINYANG[dayGan];

  // 月支藏干
  const cg = ZHI_CANGGAN[monthZhi] || [];
  const mainQi = cg[0]; // 本气

  if (!mainQi) return "未知格";

  const wxCg = GAN_WUXING[mainQi];
  const yyCg = GAN_YINYANG[mainQi];

  // 月令生我 → 印格
  if ((wxCg === "木" && wxGan === "火") || (wxCg === "火" && wxGan === "土") ||
      (wxCg === "土" && wxGan === "金") || (wxCg === "金" && wxGan === "水") ||
      (wxCg === "水" && wxGan === "木")) {
    return yyCg === yyGan ? "偏印格" : "正印格";
  }
  // 月令同我 → 建禄格 / 阳刃格
  if (wxCg === wxGan) {
    if (yyCg === yyGan) return "建禄格";
    return "阳刃格";
  }
  // 月令我生 → 食伤格
  if ((wxGan === "木" && wxCg === "火") || (wxGan === "火" && wxCg === "土") ||
      (wxGan === "土" && wxCg === "金") || (wxGan === "金" && wxCg === "水") ||
      (wxGan === "水" && wxCg === "木")) {
    return yyCg === yyGan ? "食神格" : "伤官格";
  }
  // 月令我克 → 财格
  if ((wxGan === "木" && wxCg === "土") || (wxGan === "火" && wxCg === "金") ||
      (wxGan === "土" && wxCg === "水") || (wxGan === "金" && wxCg === "木") ||
      (wxGan === "水" && wxCg === "火")) {
    return yyCg === yyGan ? "偏财格" : "正财格";
  }
  // 月令克我 → 官杀格
  return yyCg === yyGan ? "七杀格" : "正官格";
}

// ── 五行评分 ──

export interface WuxingScores {
  jin: number; mu: number; shui: number; huo: number; tu: number;
}

/** 计算五行分数 (简化加权) */
export function computeWuxingScore(
  sizhu: { year: { tg: string; dz: string }; month: { tg: string; dz: string }; day: { tg: string; dz: string }; hour: { tg: string; dz: string } },
  canggan: Record<string, string[]>,
  dayGan: string,
): WuxingScores {
  const scores: WuxingScores = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 };
  const wxToKey: Record<string, keyof WuxingScores> = {
    "金": "jin", "木": "mu", "水": "shui", "火": "huo", "土": "tu",
  };

  // 天干权重 15
  for (const p of ["year", "month", "day", "hour"] as const) {
    const wx = GAN_WUXING[sizhu[p].tg];
    const key = wxToKey[wx];
    if (key) scores[key] += 15;
  }

  // 地支权重 10
  for (const p of ["year", "month", "day", "hour"] as const) {
    const wx = ZHI_WUXING[sizhu[p].dz];
    const key = wxToKey[wx];
    if (key) scores[key] += 10;
  }

  // 藏干权重 5（仅本气和主要中气）
  for (const p of ["year", "month", "day", "hour"] as const) {
    for (const g of (canggan[p] || []).slice(0, 2)) {
      const wx = GAN_WUXING[g];
      const key = wxToKey[wx];
      if (key) scores[key] += 5;
    }
  }

  // 日干月令加成
  const dayWx = GAN_WUXING[dayGan];
  const dayKey = wxToKey[dayWx];
  if (dayKey) scores[dayKey] += 3;

  return scores;
}

/** 五行分数 → 强弱判断 */
export function getQiangruo(
  scores: WuxingScores,
  dayGan: string,
  monthZhi: string,
): { qiangruo: string; tonglei: string; yilei: string; zidang: number; yidang: number; info: string } {
  const wxToKey: Record<string, keyof WuxingScores> = {
    "金": "jin", "木": "mu", "水": "shui", "火": "huo", "土": "tu",
  };

  const dayWx = GAN_WUXING[dayGan];
  const dayKey = wxToKey[dayWx];

  // 同类 (比劫) vs 异类
  const tong = ["木","火","土","金","水"] as const;
  // 同类：同五行
  let tonglei = 0;
  let yilei = 0;
  for (const wx of tong) {
    const k = wxToKey[wx];
    if (wx === dayWx) tonglei += scores[k];
    else yilei += scores[k];
  }

  // 月令当令加成
  const monthWx = ZHI_WUXING[monthZhi];
  const monthKey = wxToKey[monthWx];
  const monthBonus = monthKey === dayKey ? 0.15 : (monthWx === dayWx ? 0.05 : 0);

  const total = tonglei + yilei;
  const tongPercent = total > 0 ? tonglei / (total + monthBonus * total) : 0.4;

  let qiangruo = "中和";
  if (tongPercent > 0.55) qiangruo = "身强";
  if (tongPercent > 0.65) qiangruo = "身旺";
  if (tongPercent < 0.40) qiangruo = "身弱";
  if (tongPercent < 0.30) qiangruo = "身极弱";

  return {
    qiangruo,
    tonglei: `${tonglei}分`,
    yilei: `${yilei}分`,
    zidang: tonglei,
    yidang: yilei,
    info: qiangruo,
  };
}

/** 五行分数 → 喜用神判断 */
export function getXiyongshen(
  scores: WuxingScores,
  dayGan: string,
  qiangruo: string,
  monthZhi: string,
): { xiyongshen: string; jishen: string; desc: string } {
  const wxToKey: Record<string, keyof WuxingScores> = {
    "金": "jin", "木": "mu", "水": "shui", "火": "huo", "土": "tu",
  };
  const keyToWx: Record<keyof WuxingScores, string> = {
    jin: "金", mu: "木", shui: "水", huo: "火", tu: "土",
  };
  const dayWx = GAN_WUXING[dayGan];

  // 生我者
  const shengWo: Record<string, string> = { "木":"水", "火":"木", "土":"火", "金":"土", "水":"金" };
  // 我生者
  const woSheng: Record<string, string> = { "木":"火", "火":"土", "土":"金", "金":"水", "水":"木" };
  // 克我者
  const keWo: Record<string, string> = { "木":"金", "火":"水", "土":"木", "金":"火", "水":"土" };

  if (qiangruo.includes("强") || qiangruo.includes("旺")) {
    // 身强：喜克泄耗 (克我/我生/我克)
    const xi = [keWo[dayWx], woSheng[dayWx]].filter(Boolean).join("、");
    const ji = [shengWo[dayWx], dayWx].filter(Boolean).join("、");
    return { xiyongshen: xi, jishen: ji, desc: `命主${qiangruo}，喜${xi}来平衡，忌${ji}过旺。建议多接触${xi}相关的人事物，能帮你更好地发挥潜能。` };
  } else {
    // 身弱：喜生扶 (生我/同我)
    const xi = [shengWo[dayWx], dayWx].filter(Boolean).join("、");
    const ji = [keWo[dayWx], woSheng[dayWx]].filter(Boolean).join("、");
    return { xiyongshen: xi, jishen: ji, desc: `命主${qiangruo}，喜${xi}来生扶，忌${ji}过旺。适当补充${xi}的能量，能让你更有底气面对挑战。` };
  }
}

// ── 星座映射 ──

export function getXingzuo(month: number, day: number): string {
  const dates = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]; // 每月星座分界日
  const signs = ["摩羯座", "水瓶座", "双鱼座", "白羊座", "金牛座", "双子座",
                 "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"];
  const idx = month - (day < dates[month - 1] ? 1 : 0);
  return signs[idx] || "";
}

// ── 生肖映射 ──

export function getShengxiao(yearGanZhi: string): string {
  const zhi = yearGanZhi[1] || "";
  const sxMap: Record<string, string> = {
    "子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔",
    "辰": "龙", "巳": "蛇", "午": "马", "未": "羊",
    "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪",
  };
  return sxMap[zhi] || "";
}

// ── 五行 → 幸运元素 ──

export const WUXING_LUCKY: Record<string, { colors: string[]; numbers: number[]; directions: string }> = {
  "木": { colors: ["松烟青", "翡翠绿"], numbers: [3, 8], directions: "东方" },
  "火": { colors: ["朱砂红", "珊瑚橙"], numbers: [2, 7], directions: "南方" },
  "土": { colors: ["鎏金棕", "琥珀黄"], numbers: [5, 0], directions: "中央" },
  "金": { colors: ["月白", "银灰"], numbers: [4, 9], directions: "西方" },
  "水": { colors: ["墨蓝", "玄黑"], numbers: [1, 6], directions: "北方" },
};

// ── 格式化农历 ──

const LUNAR_MONTH_NAMES = ["正月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "冬月", "腊月"];
const LUNAR_DAY_NAMES = [
  "", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十",
];

export function formatNongli(year: number, month: number, day: number, isLeap: boolean): string {
  const leapStr = isLeap ? "闰" : "";
  return `${leapStr}${LUNAR_MONTH_NAMES[month - 1] || month + "月"}${LUNAR_DAY_NAMES[day] || day}`;
}
