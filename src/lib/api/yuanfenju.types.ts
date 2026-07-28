// ==================== yuanfenju API 类型定义 ====================
// 基于实际 API 测试返回结构

// -- Bazi/paipan 排盘 --

export interface BaseInfo {
  sex: string; // "乾造" | "坤造"
  name: string;
  gongli: string; // 公历日期
  nongli: string; // 农历日期
  qiyun: string; // 起运时间
  jiaoyun: string; // 交运时间
  zhengge: string; // 正格
  wuxing_xiji?: string; // 五行喜忌
}

export interface Sizhu {
  year: { tg: string; dz: string };
  month: { tg: string; dz: string };
  day: { tg: string; dz: string };
  hour: { tg: string; dz: string };
}

export interface DetailInfo {
  zhuxing: Record<string, string>; // 主星：年/月/日/时
  sizhu: Sizhu;
  canggan: Record<string, string[]>; // 藏干
  fuxing: Record<string, string[]>; // 伏星/十神
  xingyun: Record<string, string>; // 星运
  zizuo: Record<string, string>;
  kongwang: Record<string, string>; // 空亡
  nayin: Record<string, string>; // 纳音
  shensha: Record<string, string>; // 神煞（空格分隔）
  dayunshensha: { tgdz: string; shensha: string }[];
}

export interface DayunInfo {
  big_god: string[]; // 大运十神
  big: string[]; // 大运干支
  big_cs: string[];
  xu_sui: number[];
  big_start_year: number[];
  big_start_year_liu_nian: string;
  big_end_year: number[];
  // 每年流年
  years_info0?: { year_char: string }[];
  years_info1?: { year_char: string }[];
  years_info2?: { year_char: string }[];
  years_info3?: { year_char: string }[];
  years_info4?: { year_char: string }[];
  years_info5?: { year_char: string }[];
  years_info6?: { year_char: string }[];
  years_info7?: { year_char: string }[];
  years_info8?: { year_char: string }[];
  years_info9?: { year_char: string }[];
}

export interface BaziInfo {
  kw: string; // 空亡
  tg_cg_god: string[]; // 天干藏干神
  bazi: string[]; // ["乙亥","甲申","乙亥","庚辰"] 或空格分隔的字符串
  dz_cg: string[]; // 地支藏干
  dz_cg_god: string[]; // 地支藏干神
  day_cs: string[]; // 日辰
  na_yin: string[]; // 纳音
}

export interface StartInfo {
  jishen: string[]; // 吉神
  xz: string; // 星座
  sx: string; // 生肖
}

export interface PaipanData {
  base_info: BaseInfo;
  bazi_info: BaziInfo;
  dayun_info: DayunInfo;
  start_info: StartInfo;
  detail_info: DetailInfo;
}

export interface PaipanResponse {
  errcode: number;
  errmsg: string;
  notice?: string;
  data: PaipanData;
}

// -- Bazi/cesuan 测算 --

export interface Xiyongshen {
  qiangruo: string; // 强弱
  xiyongshen: string; // 喜用神
  jishen: string; // 忌神
  xiyongshen_desc: string;
  jin_number: number;
  mu_number: number;
  shui_number: number;
  huo_number: number;
  tu_number: number;
  zidang: number;
  yidang: number;
  zidang_percent: string;
  yidang_percent: string;
  tonglei: string;
  yilei: string;
  rizhu_tiangan: string;
  jin_score: number;
  mu_score: number;
  shui_score: number;
  huo_score: number;
  tu_score: number;
  jin_score_percent: string;
  mu_score_percent: string;
  shui_score_percent: string;
  huo_score_percent: string;
  tu_score_percent: string;
  yinyang: string;
}

export interface Chenggu {
  year_weight: string;
  month_weight: string;
  day_weight: string;
  hour_weight: string;
  total_weight: string;
  description: string;
}

export interface CesuanBaseInfo extends BaseInfo {
  // 继承 base_info 字段
}

export interface CesuanWuxing {
  detail_desc: string;
  simple_desc: string;
  simple_description: string;
  detail_description: string;
}

export interface CesuanData {
  base_info: CesuanBaseInfo;
  bazi_info: BaziInfo & { bazi: string; na_yin: string };
  chenggu: Chenggu;
  yinyuan: { sanshishu_yinyuan: string };
  caiyun: { sanshishu_caiyun: { simple_desc: string; detail_desc: string } };
  sizhu: { rizhu: string };
  sx: string; // 生肖
  xz: string; // 星座
  mingyun: { sanshishu_mingyun: string };
  xiyongshen: Xiyongshen;
  wuxing: CesuanWuxing;
}

export interface CesuanResponse {
  errcode: number;
  errmsg: string;
  notice?: string;
  data: CesuanData;
}

// -- Bazi/yunshi 运势 --

export interface YunshiInfo {
  lucky_number: string;
  lucky_color: string;
  lucky_accessory: string;
  lucky_foods: string;
  lucky_directions: string;
  lucky_yi: string;
  lucky_ji: string;
  health_score: number;
  career_score: number;
  love_score: number;
  wealth_score: number;
  fortune_score: number;
  jixiong_today: string;
  health_description: string;
  career_description: string;
  love_description: string;
  wealth_description: string;
  fortune_description: string;
}

export interface YunshiData {
  base_info: {
    sex: string;
    name: string;
    gongli: string;
    nongli: string;
    yeargz: string;
    monthgz: string;
    daygz: string;
    hourgz: string;
    shengxiao: string;
    zhengge: string;
    xiyongshen: Xiyongshen;
    wuxing_xiji: string;
  };
  yunshi_info: YunshiInfo;
}

export interface YunshiResponse {
  errcode: number;
  errmsg: string;
  notice?: string;
  data: YunshiData;
}

// ==================== 通用 API 响应 ====================

export interface ApiResponse<T> {
  errcode: number;
  errmsg: string;
  notice?: string;
  data: T;
}
