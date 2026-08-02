// ==================== 八字本地计算引擎 ====================
// 基于 lunar-typescript + 自建查表，完全替代缘份居 API
import {
  Solar,
  Lunar,
  EightChar,
  Yun,
  LunarTime,
} from "lunar-typescript";
import type {
  PaipanData,
  CesuanData,
  YunshiData,
} from "@/lib/api/yuanfenju.types";
import {
  computeShensha,
  computeWuxingScore,
  getQiangruo,
  getXiyongshen,
  getZhengge,
  getChengguDesc,
  getNayinExact,
  getXingzuo,
  getShengxiao,
  WUXING_LUCKY,
  formatNongli,
  CHENGGU_YEAR,
  CHENGGU_MONTH,
  CHENGGU_DAY,
  CHENGGU_HOUR,
  hourToZhi,
} from "./lookup";

// ── 输入参数 ──

export interface BaziInput {
  name?: string;
  sex: 0 | 1; // 0=女 1=男 (兼容缘份居格式) 也接受 "男"/"女"
  type: 0 | 1; // 0=农历(阴历) 1=公历(阳历)
  year: number;
  month: number;
  day: number;
  hours: number;
  minute: number;
}

// ── 内部参数标准化 ──

function normInput(input: BaziInput) {
  const isSolar = input.type === 1;
  return { ...input, isSolar };
}

function toGenderStr(sex: number | string): "男" | "女" {
  if (sex === 1 || sex === "男" || sex === "male") return "男";
  return "女";
}

// ── 核心：八字排盘 Paipan ──

export function computePaipan(input: BaziInput): PaipanData {
  const { name, sex, year, month, day, hours, minute, isSolar } = normInput(input);
  const genderStr = toGenderStr(sex);

  // 1. 构造公历日期
  let solar: Solar;
  let lunar: Lunar;

  if (isSolar) {
    solar = Solar.fromYmdHms(year, month, day, hours, minute, 0);
    lunar = solar.getLunar();
  } else {
    // 农历 → 先构造 Lunar, 再拿 Solar
    lunar = Lunar.fromYmdHms(year, month, day, hours, minute, 0);
    solar = lunar.getSolar();
  }

  // 2. 八字四柱
  const ec = lunar.getEightChar();
  const sizhu = {
    year: { tg: ec.getYearGan(), dz: ec.getYearZhi() },
    month: { tg: ec.getMonthGan(), dz: ec.getMonthZhi() },
    day: { tg: ec.getDayGan(), dz: ec.getDayZhi() },
    hour: { tg: ec.getTimeGan(), dz: ec.getTimeZhi() },
  };

  const rizhuGan = sizhu.day.tg;
  const rizhuZhi = sizhu.day.dz;

  // 3. 藏干
  const canggan: Record<string, string[]> = {
    year: ec.getYearHideGan(),
    month: ec.getMonthHideGan(),
    day: ec.getDayHideGan(),
    hour: ec.getTimeHideGan(),
  };

  // 4. 纳音
  const nayin: Record<string, string> = {
    year: ec.getYearNaYin(),
    month: ec.getMonthNaYin(),
    day: ec.getDayNaYin(),
    hour: ec.getTimeNaYin(),
  };

  // 5. 十神 (伏星/主星)
  const zhuxing: Record<string, string> = {
    year: ec.getYearShiShenGan(),
    month: ec.getMonthShiShenGan(),
    day: "日元",
    hour: ec.getTimeShiShenGan(),
  };

  const fuxing: Record<string, string[]> = {
    year: ec.getYearShiShenZhi(),
    month: ec.getMonthShiShenZhi(),
    day: ec.getDayShiShenZhi(),
    hour: ec.getTimeShiShenZhi(),
  };

  // 6. 空亡
  const kongwang: Record<string, string> = {
    year: ec.getYearXunKong(),
    month: ec.getMonthXunKong(),
    day: ec.getDayXunKong(),
    hour: ec.getTimeXunKong(),
  };

  // 7. 神煞
  const shensha = computeShensha(sizhu);
  const dayunshensha: { tgdz: string; shensha: string }[] = []; // 等大运计算完再补充

  // 8. 星运 (十二长生)
  const xingyun: Record<string, string> = {
    year: ec.getYearDiShi(),
    month: ec.getMonthDiShi(),
    day: ec.getDayDiShi(),
    hour: ec.getTimeDiShi(),
  };

  // 9. 格局
  const zhengge = getZhengge(sizhu.month.dz, rizhuGan);

  // 10. 大运
  const genderCode = sex === 1 ? 0 : 1; // lunar-typescript: 0=女 1=男
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yun: Yun = ec.getYun(genderCode) as any;
  const dayuns = yun.getDaYun(10);

  const big_god: string[] = [];
  const big: string[] = [];
  const big_cs: string[] = [];
  const xu_sui: number[] = [];
  const big_start_year: number[] = [];
  const big_end_year: number[] = [];

  for (const dy of dayuns) {
    big.push(dy.getGanZhi());
    big_cs.push("");
    xu_sui.push(dy.getStartAge());
    big_start_year.push(dy.getStartYear());
    big_end_year.push(dy.getEndYear());
    // 大运十神：用大运天干计算
    const dyGan = dy.getGanZhi()[0];
    const shiShenInfo = getShiShenForGanZhi(rizhuGan, dyGan);
    big_god.push(shiShenInfo);
  }

  // 流年 (每个大运各10年，包含干支)
  const yearsInfoMap: Record<string, { year_char: string }[]> = {};
  for (let i = 0; i < Math.min(10, dayuns.length); i++) {
    const liuNians = dayuns[i].getLiuNian(10);
    const dyGan = dayuns[i].getGanZhi()[0];
    yearsInfoMap[`years_info${i}`] = liuNians.map((ln) => {
      const lnGz = ln.getGanZhi();
      const lnGan = lnGz[0];
      const lnDesc = getShiShenForGanZhi(rizhuGan, lnGan);
      return {
        year_char: `${ln.getYear()}年（${lnGz}·${lnDesc}）`,
      };
    });
  }

  const firstDayunLiunian = dayuns[0]?.getLiuNian(1)?.[0];
  const big_start_year_liu_nian = firstDayunLiunian
    ? `${dayuns[0].getStartYear()}年`
    : "";

  // 11. 起运 / 交运
  const qiyunSolar = yun.getStartSolar();
  const qiyunStr = `${qiyunSolar.getYear()}年${qiyunSolar.getMonth()}月${qiyunSolar.getDay()}日`;
  const jiaoyunStr = qiyunStr; // 通常起运即交运

  // 12. bazi_info
  const baziArr = [
    `${sizhu.year.tg}${sizhu.year.dz}`,
    `${sizhu.month.tg}${sizhu.month.dz}`,
    `${sizhu.day.tg}${sizhu.day.dz}`,
    `${sizhu.hour.tg}${sizhu.hour.dz}`,
  ];

  const naYinArr = [nayin.year, nayin.month, nayin.day, nayin.hour];

  const tgCgGodArr: string[] = [ec.getYearShiShenGan(), ec.getMonthShiShenGan(), "日元", ec.getTimeShiShenGan()];
  const dzCgArr: string[] = canggan.year.concat(canggan.month, canggan.day, canggan.hour);

  const dzCgGodArr: string[] = [];
  for (const p of ["year", "month", "day", "hour"] as const) {
    for (const g of (canggan[p] || [])) {
      dzCgGodArr.push(getShiShenForGanZhi(rizhuGan, g));
    }
  }

  // 13. 五行喜忌简述
  const scores = computeWuxingScore(sizhu, canggan, rizhuGan);
  const qr = getQiangruo(scores, rizhuGan, sizhu.month.dz);
  const xy = getXiyongshen(scores, rizhuGan, qr.qiangruo, sizhu.month.dz);

  // 14. 组装 PaipanData
  return {
    base_info: {
      sex: genderStr === "男" ? "乾造" : "坤造",
      name: name || "用户",
      gongli: `${solar.getYear()}-${String(solar.getMonth()).padStart(2, "0")}-${String(solar.getDay()).padStart(2, "0")}`,
      nongli: formatNongli(lunar.getYear(), lunar.getMonth(), lunar.getDay(), false),
      qiyun: qiyunStr,
      jiaoyun: jiaoyunStr,
      zhengge,
      wuxing_xiji: `喜${xy.xiyongshen}，忌${xy.jishen}`,
    },
    bazi_info: {
      kw: kongwang.day || "",
      tg_cg_god: tgCgGodArr,
      bazi: baziArr,
      dz_cg: dzCgArr,
      dz_cg_god: dzCgGodArr,
      day_cs: [],
      na_yin: naYinArr,
    },
    dayun_info: {
      big_god,
      big,
      big_cs,
      xu_sui,
      big_start_year,
      big_start_year_liu_nian,
      big_end_year,
      ...yearsInfoMap,
    },
    start_info: {
      jishen: [],
      xz: getXingzuo(solar.getMonth(), solar.getDay()),
      sx: getShengxiao(baziArr[0]),
    },
    detail_info: {
      zhuxing,
      sizhu,
      canggan,
      fuxing,
      xingyun,
      zizuo: { year: "", month: "", day: "", hour: "" },
      kongwang,
      nayin,
      shensha,
      dayunshensha,
    },
  };
}

// ── 八字测算 Cesuan ──

export function computeCesuan(input: BaziInput): CesuanData {
  const paipan = computePaipan(input);
  const { name, sex, year, month, day, hours, minute, isSolar } = normInput(input);
  const genderStr = toGenderStr(sex);

  const sizhu = paipan.detail_info.sizhu;
  const rizhuGan = sizhu.day.tg;
  const rizhuZhi = sizhu.day.dz;
  const canggan = paipan.detail_info.canggan;

  // 五行评分
  const scores = computeWuxingScore(sizhu, canggan, rizhuGan);
  const qr = getQiangruo(scores, rizhuGan, sizhu.month.dz);
  const xy = getXiyongshen(scores, rizhuGan, qr.qiangruo, sizhu.month.dz);

  const totalScore = scores.jin + scores.mu + scores.shui + scores.huo + scores.tu;
  const pct = (v: number) => totalScore > 0 ? `${Math.round(v / totalScore * 100)}%` : "—";

  // 称骨
  const yearGZ = `${sizhu.year.tg}${sizhu.year.dz}`;
  const yQian = CHENGGU_YEAR[yearGZ] || 10;
  const mQian = CHENGGU_MONTH[month] || 8;
  const dQian = CHENGGU_DAY[day] || 10;
  const hZhi = sizhu.hour.dz;
  const hQian = CHENGGU_HOUR[hZhi] || 8;
  const totalQian = yQian + mQian + dQian + hQian;
  const cgInfo = getChengguDesc(totalQian);

  // 星座/生肖
  let solar: Solar;
  let lunar: Lunar;
  if (isSolar) {
    solar = Solar.fromYmdHms(year, month, day, hours, minute, 0);
    lunar = solar.getLunar();
  } else {
    lunar = Lunar.fromYmdHms(year, month, day, hours, minute, 0);
    solar = lunar.getSolar();
  }
  const xz = getXingzuo(solar.getMonth(), solar.getDay());
  const sx = getShengxiao(yearGZ);

  // 构建 CesuanData
  return {
    base_info: {
      ...paipan.base_info,
      sex: genderStr === "男" ? "乾造" : "坤造",
      name: name || "用户",
    } as CesuanData["base_info"],
    bazi_info: {
      ...paipan.bazi_info,
      bazi: paipan.bazi_info.bazi.join(" "),
      na_yin: paipan.bazi_info.na_yin.join(" · "),
    },
    chenggu: {
      year_weight: `${yQian}钱`,
      month_weight: `${mQian}钱`,
      day_weight: `${dQian}钱`,
      hour_weight: `${hQian}钱`,
      total_weight: cgInfo.weight,
      description: cgInfo.desc,
    },
    yinyuan: { sanshishu_yinyuan: "桃花参差，贵人指引。宜以真心待人，缘分自会水到渠成。" },
    caiyun: {
      sanshishu_caiyun: {
        simple_desc: "正财平稳，偏财宜慎",
        detail_desc: "正财收入稳定，宜以专业立身。偏财方面不宜冒进，聚焦主业方能积少成多。",
      },
    },
    sizhu: { rizhu: `${rizhuGan}${rizhuZhi}日元` },
    sx,
    xz,
    mingyun: {
      sanshishu_mingyun: `${genderStr === "男" ? "乾造" : "坤造"}：${paipan.base_info.zhengge || ""}，${qr.qiangruo}，${xy.desc.slice(0, 50)}`,
    },
    xiyongshen: {
      qiangruo: qr.qiangruo,
      xiyongshen: xy.xiyongshen,
      jishen: xy.jishen,
      xiyongshen_desc: xy.desc,
      jin_number: scores.jin,
      mu_number: scores.mu,
      shui_number: scores.shui,
      huo_number: scores.huo,
      tu_number: scores.tu,
      zidang: qr.zidang,
      yidang: qr.yidang,
      zidang_percent: totalScore > 0 ? `${Math.round(qr.zidang / totalScore * 100)}%` : "—",
      yidang_percent: totalScore > 0 ? `${Math.round(qr.yidang / totalScore * 100)}%` : "—",
      tonglei: qr.tonglei,
      yilei: qr.yilei,
      rizhu_tiangan: rizhuGan,
      jin_score: scores.jin,
      mu_score: scores.mu,
      shui_score: scores.shui,
      huo_score: scores.huo,
      tu_score: scores.tu,
      jin_score_percent: pct(scores.jin),
      mu_score_percent: pct(scores.mu),
      shui_score_percent: pct(scores.shui),
      huo_score_percent: pct(scores.huo),
      tu_score_percent: pct(scores.tu),
      yinyang: "",
    },
    wuxing: {
      detail_desc: `五行总览：金${scores.jin}分(${pct(scores.jin)})，木${scores.mu}分(${pct(scores.mu)})，水${scores.shui}分(${pct(scores.shui)})，火${scores.huo}分(${pct(scores.huo)})，土${scores.tu}分(${pct(scores.tu)})。${qr.qiangruo}，${xy.desc.slice(0, 80)}`,
      simple_desc: `${qr.qiangruo} · 喜${xy.xiyongshen}`,
      simple_description: `${qr.qiangruo} · 喜${xy.xiyongshen}`,
      detail_description: `五行综合得分：${qr.qiangruo}。${xy.desc.slice(0, 100)}`,
    },
  };
}

// ── 每日运势 Yunshi ──

export function computeYunshi(input: BaziInput): YunshiData {
  const paipan = computePaipan(input);
  const cesuan = computeCesuan(input);
  const { name, sex, isSolar, year, month, day, hours, minute } = normInput(input);
  const genderStr = toGenderStr(sex);

  const sizhu = paipan.detail_info.sizhu;
  const rizhuGan = sizhu.day.tg;
  const rizhuZhi = sizhu.day.dz;
  const yearGZ = `${sizhu.year.tg}${sizhu.year.dz}`;

  // 构造今日
  const today = new Date();
  const todaySolar = Solar.fromDate(today);
  const todayLunar = todaySolar.getLunar();
  const todayEC = todayLunar.getEightChar();
  const todayGan = todayEC.getDayGan();
  const todayZhi = todayEC.getDayZhi();

  // 宜忌
  const lunarTime = LunarTime.fromYmdHms(
    todayLunar.getYear(), todayLunar.getMonth(), todayLunar.getDay(),
    today.getHours(), today.getMinutes(), 0,
  );
  const yi = lunarTime.getYi();
  const ji = lunarTime.getJi();

  // 简洁运势评分 (基于日干与今日日干的五行关系)
  const wxRizhu = GAN_WUXING_MAP[rizhuGan] || "土";
  const wxToday = GAN_WUXING_MAP[todayGan] || "土";

  // 简化评分逻辑：生我/同我 → 高分, 我生 → 中, 克我/我克 → 一般
  const relationScore = getDayRelationScore(rizhuGan, todayGan);
  const baseScore = 55 + relationScore;

  const lucky = WUXING_LUCKY[cesuan.xiyongshen?.xiyongshen?.split("、")[0] as string] || WUXING_LUCKY["土"];

  const yunshiInfo = {
    lucky_number: lucky.numbers.join("、"),
    lucky_color: lucky.colors.join("、"),
    lucky_accessory: "玉石饰品",
    lucky_foods: "清淡饮食",
    lucky_directions: lucky.directions,
    lucky_yi: yi.slice(0, 4).join("、") || "出行、会友、签约",
    lucky_ji: ji.slice(0, 3).join("、") || "争辩、动土",
    health_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    career_score: Math.min(100, baseScore + Math.floor(Math.random() * 15)),
    love_score: Math.min(100, baseScore + Math.floor(Math.random() * 12)),
    wealth_score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    fortune_score: Math.min(100, baseScore + Math.floor(Math.random() * 8)),
    jixiong_today: baseScore >= 75 ? "大吉" : baseScore >= 60 ? "吉" : baseScore >= 45 ? "平" : "小凶",
    health_description: "身体状况整体平稳，注意作息规律，午后可小憩片刻恢复精力。",
    career_description: "工作中宜稳扎稳打，上午效率较高，重要事务尽量安排在午时前完成。",
    love_description: "感情运势平稳，单身者宜积极参与社交，有伴者适合安排一次温馨的共处时光。",
    wealth_description: "财运平稳，正财可期。今日不宜大额投资或冲动消费，记账与复盘比开源更重要。",
    fortune_description: "整体运势平稳向好。保持平常心，顺其自然，贵人自会在你需要时出现。",
  };

  return {
    base_info: {
      sex: genderStr === "男" ? "乾造" : "坤造",
      name: name || "用户",
      gongli: `${todaySolar.getYear()}-${String(todaySolar.getMonth()).padStart(2, "0")}-${String(todaySolar.getDay()).padStart(2, "0")}`,
      nongli: formatNongli(todayLunar.getYear(), todayLunar.getMonth(), todayLunar.getDay(), false),
      yeargz: `${todayEC.getYearGan()}${todayEC.getYearZhi()}`,
      monthgz: `${todayEC.getMonthGan()}${todayEC.getMonthZhi()}`,
      daygz: `${todayGan}${todayZhi}`,
      hourgz: `${todayEC.getTimeGan()}${todayEC.getTimeZhi()}`,
      shengxiao: getShengxiao(yearGZ),
      zhengge: paipan.base_info.zhengge || "",
      xiyongshen: cesuan.xiyongshen,
      wuxing_xiji: paipan.base_info.wuxing_xiji || "",
    },
    yunshi_info: yunshiInfo,
  };
}

// ── 辅助函数 ──

const GAN_WUXING_MAP: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火",
  "戊": "土", "己": "土", "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
};

function getShiShenForGanZhi(rizhuGan: string, targetGan: string): string {
  const wxR = GAN_WUXING_MAP[rizhuGan];
  const wxT = GAN_WUXING_MAP[targetGan];
  if (!wxR || !wxT) return "";
  const yyR = ["甲","丙","戊","庚","壬"].includes(rizhuGan) ? 1 : 0;
  const yyT = ["甲","丙","戊","庚","壬"].includes(targetGan) ? 1 : 0;
  if (wxR === wxT) return yyR === yyT ? "比肩" : "劫财";
  const sheng: Record<string, string> = { "木":"火", "火":"土", "土":"金", "金":"水", "水":"木" };
  const ke: Record<string, string> = { "木":"土", "土":"水", "水":"火", "火":"金", "金":"木" };
  if (sheng[wxR] === wxT) return yyR === yyT ? "食神" : "伤官";
  if (ke[wxR] === wxT) return yyR === yyT ? "偏财" : "正财";
  if (sheng[wxT] === wxR) return yyR === yyT ? "偏印" : "正印";
  return yyR === yyT ? "七杀" : "正官";
}

function getDayRelationScore(rizhuGan: string, todayGan: string): number {
  const wxR = GAN_WUXING_MAP[rizhuGan];
  const wxT = GAN_WUXING_MAP[todayGan];
  if (!wxR || !wxT) return 0;
  const sheng: Record<string, string> = { "木":"火", "火":"土", "土":"金", "金":"水", "水":"木" };
  const ke: Record<string, string> = { "木":"土", "土":"水", "水":"火", "火":"金", "金":"木" };
  if (wxR === wxT) return 25; // 比和：吉
  if (sheng[wxT] === wxR) return 20; // 生我：大吉
  if (sheng[wxR] === wxT) return 10; // 我生：平
  if (ke[wxT] === wxR) return -5; // 克我：小凶
  if (ke[wxR] === wxT) return 5; // 我克：平
  return 0;
}
