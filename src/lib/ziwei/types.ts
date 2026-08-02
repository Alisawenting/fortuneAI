// ==================== 紫微斗数类型定义 ====================

/** 单个宫位简化数据 */
export interface ZiweiPalace {
  index: number;
  name: string;               // "命宫", "兄弟", "夫妻" 等
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  heavenlyStem: string;       // 宫位天干
  earthlyBranch: string;      // 宫位地支
  majorStars: string[];       // 主星名称列表
  minorStars: string[];       // 辅星名称列表
  changsheng12: string;       // 长生12神
  boshi12: string;            // 博士12神
  jiangqian12: string;        // 将前12神
  suiqian12: string;          // 岁前12神
  decadalRange: [number, number];  // 大限年龄范围
  decadalHeavenlyStem: string;
  decadalEarthlyBranch: string;
  ages: number[];             // 小限年龄
}

/** 排盘完整数据 */
export interface ZiweiChartData {
  gender: string;
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  time: string;               // 时辰，如 "卯时"
  timeRange: string;          // 对应时间，如 "05:00~06:59"
  sign: string;               // 星座
  zodiac: string;             // 生肖
  soulPalace: string;         // 命宫地支
  bodyPalace: string;         // 身宫地支
  soul: string;               // 命主
  body: string;               // 身主
  fiveElementsClass: string;  // 五行局
  palaces: ZiweiPalace[];
}

/** 输入参数 */
export interface ZiweiInput {
  name?: string;
  gender: "男" | "女";
  birthDate: string;          // "YYYY-MM-DD"
  birthTime: string;          // "HH:MM"
  calendar: "公历" | "农历";
  isLeapMonth?: boolean;
}
