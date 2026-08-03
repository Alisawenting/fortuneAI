import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import {
  ChevronLeft, Briefcase, Coins, HeartHandshake, Users2, GraduationCap, Smile,
  Play, MessageCircle, Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { analyzeBazi } from "@/lib/api/yuanfenju.functions";
import { getActiveRole } from "@/lib/roles";
import type { CesuanData, PaipanData } from "@/lib/api/yuanfenju.types";

export const Route = createFileRoute("/reading")({
  head: () => ({
    meta: [
      { title: "AI 个性化解读 · 云枢易馆" },
      { name: "description", content: "六大场景化解读 + 流年大运 + AI 顺势建议。" },
    ],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const locationState = useRouterState({ select: (s) => s.location.state }) as {
    paipanData?: PaipanData;
    cesuanData?: CesuanData;
  } | undefined;

  // 尝试从 localStorage 恢复排盘数据（解决导航返回时丢失问题）
  const restoredPaipan = (() => {
    if (locationState?.paipanData) return locationState.paipanData;
    try {
      const cached = localStorage.getItem("yunshu:last-paipan");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  const [cesuanData, setCesuanData] = useState<CesuanData | null>(
    locationState?.cesuanData || null,
  );
  const [loading, setLoading] = useState(!locationState?.cesuanData);

  const paipanData = restoredPaipan;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (cesuanData) return;
    const role = getActiveRole();
    if (!role) { setLoading(false); return; }

    setLoading(true);
    analyzeBazi({
      data: {
        gender: role.gender,
        birthDate: role.birthDate,
        birthTime: role.birthTime,
        calendar: role.calendar || "公历",
      },
    })
      .then((result) => {
        if (result.success) setCesuanData(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const xiyong = cesuanData?.xiyongshen;
  const chenggu = cesuanData?.chenggu;
  const wuxing = cesuanData?.wuxing;
  const rizhu = cesuanData?.sizhu?.rizhu;

  // 动态场景数据
  const scenes: { icon: LucideIcon; title: string; tone: string; text: string }[] = [
    { icon: Briefcase, title: "事业职场", tone: "text-primary bg-primary/10",
      text: chenggu?.description || "今年走「正印」之运，宜稳中求进。三季度有一次主动汇报的机会，请提前一周准备材料。" },
    { icon: Coins, title: "财运投资", tone: "text-[var(--gold)] bg-gold/[0.15]",
      text: cesuanData?.caiyun?.sanshishu_caiyun?.detail_desc || "正财平稳，偏财起伏。请避开高杠杆，将一笔小额预算分批配置于稳健品类。" },
    { icon: HeartHandshake, title: "情感婚姻", tone: "text-[var(--cinnabar)] bg-cinnabar/[0.12]",
      text: cesuanData?.yinyuan?.sanshishu_yinyuan || "桃花轻盈，关系前先看价值观。若已有伴侣，今年宜在生活节奏上做减法。" },
    { icon: Users2, title: "人际人脉", tone: "text-accent bg-accent/10",
      text: xiyong?.xiyongshen_desc || "贵人多在长辈与同行女性之中，主动发起请教，回报比预期来得更快。" },
    { icon: GraduationCap, title: "学业成长", tone: "text-[var(--jade)] bg-jade/[0.12]",
      text: wuxing?.detail_description || "适合开启一项「慢学习」——语言、写作或一门手艺，年底可见明显进步。" },
    { icon: Smile, title: "情绪心态", tone: "text-primary bg-primary/10",
      text: cesuanData?.mingyun?.sanshishu_mingyun || "夏至到立秋期间易心绪起伏，给自己安排两段无目的的散步时间。" },
  ];

  // 命格总评
  const zongping = cesuanData
    ? `${rizhu?.slice(0, 30) || ""}。${xiyong?.qiangruo || ""}，${xiyong?.xiyongshen_desc || ""}`
    : "戊辰日元，似春田初翻——内里厚重，外却温和。你不属于一鸣惊人之人，却拥有「水落石出」的福气：越是被时间打磨的事，越能长在你身上。";

  // TTS 语音播报
  const handleTTS = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const parts: string[] = [];
    if (zongping) parts.push(zongping);
    scenes.forEach((s) => parts.push(`${s.title}：${s.text}`));
    const text = parts.join("。");
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [speaking, zongping, scenes]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <button onClick={() => window.history.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-serif-cn text-base font-medium">AI 个性化解读</p>
        <button onClick={handleTTS} className={`flex h-9 items-center gap-1 rounded-full px-3 text-xs shadow-soft transition ${speaking ? "bg-primary text-primary-foreground" : "bg-card text-primary"}`}>
          <Play className="h-3.5 w-3.5" /> {speaking ? "播报中" : "语音"}
        </button>
      </header>

      <div className="px-5 pt-5">
        <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 shadow-soft">
          <p className="text-xs text-primary">命格总评</p>
          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
            </div>
          ) : (
            <p className="mt-2 font-serif-cn text-lg leading-8">{zongping}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              xiyong?.xiyongshen || "厚积薄发",
              xiyong?.qiangruo || "贵人扶持",
              xiyong?.tonglei || "情感细腻",
              wuxing?.simple_desc || "宜静养心",
            ]
              .filter(Boolean)
              .slice(0, 4)
              .map((t) => (
                <span key={t} className="rounded-full bg-card/70 px-3 py-1 text-[11px]">{t}</span>
              ))}
          </div>
        </section>

        <p className="mt-6 mb-3 font-serif-cn text-sm text-muted-foreground">六大场景 · 分维解读</p>
        <div className="space-y-3">
          {scenes.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.title} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="font-serif-cn text-sm font-medium">{s.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/85">{s.text}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-serif-cn text-sm font-medium">流年 · 大运</p>
          <div className="mt-4 space-y-3">
            {[
              { time: "今年 · 乙巳", text: "机遇：贵人 / 文书 · 风险：口舌" },
              { time: "明年 · 丙午", text: "机遇：转岗 / 副业 · 风险：耗财" },
              { time: "大运 28-37", text: "财官并美之运，宜立长志" },
            ].map((r) => (
              <div key={r.time} className="flex items-start gap-3 border-l-2 border-primary/40 pl-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.time}</p>
                  <p className="text-xs text-muted-foreground">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-secondary/60 p-5">
          <p className="font-serif-cn text-sm font-medium">AI 顺势建议</p>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            <li>· 早晨先做最难的一件事，给一天定一个「重」</li>
            <li>· 与水相关的事物利你：泡茶、临水、写字</li>
            <li>· 重要决定，给自己留一夜的时间再回答</li>
          </ul>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3 pb-2">
          <Link to="/chat" className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm text-primary-foreground shadow-floating">
            <MessageCircle className="h-4 w-4" /> 继续问 AI
          </Link>
          <button className="flex items-center justify-center gap-2 rounded-2xl border border-primary bg-card py-3 text-sm text-primary">
            <ImageIcon className="h-4 w-4" /> 生成海报
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
