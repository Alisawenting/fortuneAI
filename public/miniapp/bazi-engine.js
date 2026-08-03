// ==================== 八字计算引擎（纯 JS，离线可用）====================
const GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const WX = { "甲":"木","乙":"木","丙":"火","丁":"火","戊":"土","己":"土","庚":"金","辛":"金","壬":"水","癸":"水" };
const WX_Z = { "寅":"木","卯":"木","巳":"火","午":"火","辰":"土","戌":"土","丑":"土","未":"土","申":"金","酉":"金","亥":"水","子":"水" };
const CG = { "子":["癸"],"丑":["己","癸","辛"],"寅":["甲","丙","戊"],"卯":["乙"],"辰":["戊","乙","癸"],"巳":["丙","庚","戊"],"午":["丁","己"],"未":["己","丁","乙"],"申":["庚","壬","戊"],"酉":["辛"],"戌":["戊","辛","丁"],"亥":["壬","甲"] };
const NAYIN_30 = ["海中金","炉中火","大林木","路旁土","剑锋金","山头火","涧下水","城头土","白蜡金","杨柳木","井泉水","屋上土","霹雳火","松柏木","流年水","砂中金","山下火","平地木","壁上土","金箔金","覆灯火","天河水","大驿土","钗钏金","桑柘木","大溪水","沙中土","天上火","石榴木","大海水"];

function gzIndex(g, z) { return (GAN.indexOf(g)*6 + Math.floor(ZHI.indexOf(z)/2)) % 60; }
function getNayin(g, z) { return NAYIN_30[Math.floor(gzIndex(g,z)/2)]; }
function getShiShen(riGan, tg) {
  const wxR = WX[riGan], wxT = WX[tg];
  const yy = g => "甲丙戊庚壬".includes(g);
  if(wxR===wxT) return yy(riGan)===yy(tg)?"比肩":"劫财";
  const s={木:"火",火:"土",土:"金",金:"水",水:"木"}, k={木:"土",土:"水",水:"火",火:"金",金:"水"};
  if(s[wxR]===wxT) return yy(riGan)===yy(tg)?"食神":"伤官";
  if(k[wxR]===wxT) return yy(riGan)===yy(tg)?"偏财":"正财";
  if(s[wxT]===wxR) return yy(riGan)===yy(tg)?"偏印":"正印";
  return yy(riGan)===yy(tg)?"七杀":"正官";
}

// 公历 → 日干支 (基于 1900-01-01 = 甲戌日)
function getDayGZ(y, m, d) {
  let days = Math.floor((y-1900)*365.25) + Math.floor((m-1)*30.6) + d;
  if(m>2) days -= Math.floor(y/4)-Math.floor(1900/4);
  else days -= Math.floor((y-1)/4)-Math.floor(1900/4);
  const idx = ((days - 1) % 60 + 60) % 60;
  return GAN[idx%10] + ZHI[idx%12];
}

// 年干支 (以立春为界，简化处理以2月4日为界)
function getYearGZ(y, m, d) {
  const springDate = (y%4===0 && (y%100!==0||y%400===0)) ? 4 : 4;
  const offsetY = (m<2 || (m===2 && d<springDate)) ? y-1 : y;
  const idx = (offsetY - 4) % 60;
  return GAN[idx%10] + ZHI[idx%12];
}

// 月干支 (五虎遁: 甲己之年丙作首)
function getMonthGZ(yGan, m) {
  const hl = { "甲":2,"乙":4,"丙":6,"丁":8,"戊":0,"己":2,"庚":4,"辛":6,"壬":8,"癸":0 };
  const base = hl[yGan];
  const gIdx = (base + m - 1) % 10;
  const zIdx = (m + 1) % 12;
  return GAN[gIdx] + ZHI[zIdx];
}

// 时干支 (五鼠遁: 甲己还加甲)
function getHourGZ(dayGan, hour) {
  const hl = { "甲":0,"乙":2,"丙":4,"丁":6,"戊":8,"己":0,"庚":2,"辛":4,"壬":6,"癸":8 };
  const zIdx = hour < 23 ? Math.floor((hour+1)/2) % 12 : 0;
  const gIdx = (hl[dayGan] + zIdx) % 10;
  return GAN[gIdx] + ZHI[zIdx];
}

// 时辰序号 → 地支
function hourToZhi(h) { return ZHI[h<23?Math.floor((h+1)/2)%12:0]; }

// 称骨查表
const CHENGGU_Y = {"甲子":12,"乙丑":9,"丙寅":6,"丁卯":7,"戊辰":12,"己巳":5,"庚午":9,"辛未":8,"壬申":7,"癸酉":8,"甲戌":15,"乙亥":9,"丙子":16,"丁丑":8,"戊寅":8,"己卯":19,"庚辰":12,"辛巳":6,"壬午":8,"癸未":7,"甲申":5,"乙酉":15,"丙戌":6,"丁亥":16,"戊子":15,"己丑":7,"庚寅":9,"辛卯":12,"壬辰":10,"癸巳":7,"甲午":15,"乙未":6,"丙申":5,"丁酉":14,"戊戌":14,"己亥":9,"庚子":7,"辛丑":7,"壬寅":9,"癸卯":12,"甲辰":8,"乙巳":7,"丙午":13,"丁未":5,"戊申":14,"己酉":5,"庚戌":9,"辛亥":17,"壬子":5,"癸丑":7,"甲寅":12,"乙卯":8,"丙辰":8,"丁巳":6,"戊午":19,"己未":6,"庚申":8,"辛酉":16,"壬戌":10,"癸亥":7};
const CHENGGU_M = [0,6,7,18,9,5,16,9,15,18,8,9,5];
const CHENGGU_D = [0,5,10,8,15,16,15,8,16,8,16,9,17,8,17,10,8,9,18,5,15,10,9,8,9,15,18,7,8,16,6];
const CHENGGU_H = {"子":16,"丑":6,"寅":7,"卯":10,"辰":9,"巳":16,"午":10,"未":8,"申":8,"酉":9,"戌":6,"亥":6};

// 主函数
function computeBazi(birthDate, birthTime) {
  const [y,m,d] = birthDate.split("-").map(Number);
  const [h,min] = birthTime.split(":").map(Number);

  const yGZ = getYearGZ(y, m, d);
  const mGZ = getMonthGZ(yGZ[0], m);
  const dGZ = getDayGZ(y, m, d);
  const hZhi = hourToZhi(h);
  const hGZ = getHourGZ(dGZ[0], h);

  const riGan = dGZ[0], riZhi = dGZ[1];
  const pillars = [
    { label:"年柱", g:yGZ[0], z:yGZ[1] },
    { label:"月柱", g:mGZ[0], z:mGZ[1] },
    { label:"日柱", g:riGan, z:riZhi },
    { label:"时柱", g:hGZ[0], z:hGZ[1] },
  ];

  // 藏干
  const canggan = pillars.map(p => CG[p.z] || []);
  // 纳音
  const nayin = pillars.map(p => getNayin(p.g, p.z));
  // 十神
  const shishen = pillars.map(p => p.label==="日柱"?"日元":getShiShen(riGan, p.g));
  // 空亡
  const xunkong = pillars.map(p => { const xz = Math.floor(ZHI.indexOf(p.z)/2)*2; return ZHI[xz]+ZHI[(xz+1)%12]; });

  // 大运 (简化版)
  const gender = 1; // 默认男性
  const dayuns = [];
  for(let i=0;i<8;i++){
    const startAge = 3 + i*10;
    const gIdx = (GAN.indexOf(riGan) + i + 1) % 10;
    const zIdx = (ZHI.indexOf(riZhi) + i + 1) % 12;
    const dyGz = GAN[gIdx] + ZHI[zIdx];
    dayuns.push({ age:startAge+"-"+(startAge+9), gz:dyGz, god:getShiShen(riGan, dyGz[0]), current:false });
  }

  // 五行评分
  const scores = { 木:0,火:0,土:0,金:0,水:0 };
  pillars.forEach(p => { scores[WX[p.g]]=(scores[WX[p.g]]||0)+15; scores[WX_Z[p.z]]=(scores[WX_Z[p.z]]||0)+10; });
  canggan.forEach((arr,i) => arr.slice(0,2).forEach(cg => { scores[WX[cg]]=(scores[WX[cg]]||0)+5; }));
  const dayWx = WX[riGan];
  const tonglei = scores[dayWx] || 0;
  const yilei = Object.values(scores).reduce((a,b)=>a+b,0) - tonglei;
  const qiangruo = tonglei > yilei*1.2 ? "身强" : tonglei < yilei*0.8 ? "身弱" : "中和";

  // 喜用神
  const sheng={木:"水",火:"木",土:"火",金:"土",水:"金"}, ke={木:"金",火:"水",土:"木",金:"火",水:"土"};
  const woSheng={木:"火",火:"土",土:"金",金:"水",水:"木"};
  const xiyongshen = qiangruo.includes("强") ? `${ke[dayWx]}、${woSheng[dayWx]}` : `${sheng[dayWx]}、${dayWx}`;

  // 格局
  const zhiWx = WX_Z[ZHI[(m+1)%12]]; // 月令
  const zhenggeMap = {
    "木火":"食神格","火土":"食神格","土金":"食神格","金水":"食神格","水木":"食神格",
  };
  let zhengge = "正印格";
  if(zhiWx === dayWx) zhengge = "建禄格";
  else if(sheng[dayWx]===zhiWx) zhengge = GAN.indexOf(riGan)%2===0 ? "正印格":"偏印格";
  else if(woSheng[dayWx]===zhiWx) zhengge = GAN.indexOf(riGan)%2===0 ? "食神格":"伤官格";

  // 称骨
  const yQ = CHENGGU_Y[yGZ]||10, mQ = CHENGGU_M[m], dQ = CHENGGU_D[d], hQ = CHENGGU_H[hZhi]||8;
  const total = yQ+mQ+dQ+hQ;

  return {
    gender: "乾造",
    gongli: `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
    nongli: "农历（简化）",
    sizhu: pillars,
    canggan,
    nayin,
    shishen,
    xunkong,
    dayuns,
    scores,
    qiangruo,
    xiyongshen,
    zhengge,
    chenggu: { total, liang: Math.floor(total/10), qian: total%10 },
    rizhu: `${riGan}${riZhi}日元`,
  };
}

if(typeof module!=="undefined") module.exports={computeBazi,GAN,ZHI,WX,WX_Z,CG,NAYIN_30,getDayGZ,getYearGZ,getMonthGZ,getHourGZ,getShiShen,getNayin};
