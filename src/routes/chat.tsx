import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Mic, Send, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "@/lib/api/chat.functions";
import { calculateBazi } from "@/lib/api/yuanfenju.functions";
import { getActiveRole, readRoles, setActiveRoleId, readActiveRoleId, ROLE_CHANGE_EVENT, type Role } from "@/lib/roles";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MarkdownText } from "@/lib/utils";
import { toast } from "sonner";
import type { PaipanData } from "@/lib/api/yuanfenju.types";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI 问答 · 云枢易馆" }, { name: "description", content: "AI 命理师基于命盘深度解读。" }] }),
  component: ChatPage,
});

interface Msg { id: string; role: "user" | "ai"; content: string; }

function ChatPage() {
  const initialRole = typeof window !== "undefined" ? getActiveRole() : null;
  const [role, setRole] = useState<Role | null>(initialRole);
  const [roles, setRoles] = useState<Role[]>(typeof window !== "undefined" ? readRoles() : []);
  const [roleOpen, setRoleOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: "w", role: "ai", content: initialRole
      ? `你好！我已加载「${initialRole.name}」的命盘（${initialRole.gender}·${initialRole.birthDate}）。正在获取八字数据...`
      : "你好！我是云枢易馆的 AI 命理师「枢机」。请先在测算页面录入生辰，我就能结合命盘为你解读。" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [baziCtx, setBaziCtx] = useState<Record<string, string>>({});
  const [baziLoading, setBaziLoading] = useState(!!initialRole);
  const listRef = useRef<HTMLDivElement>(null);

  // 加载指定角色的八字数据
  const loadRoleBazi = useCallback(async (r: Role) => {
    setBaziLoading(true);
    const ctx: Record<string, string> = { name: r.name, sex: r.gender === "男" ? "乾造" : "坤造", birthDate: r.birthDate, birthTime: r.birthTime };

    try {
      const cached = localStorage.getItem("yunshu:last-paipan");
      let hasCached = false;
      if (cached) {
        const p = JSON.parse(cached) as PaipanData;
        if (p.detail_info?.sizhu && p.base_info?.name === r.name) {
          const s = p.detail_info.sizhu;
          ctx.sizhu = `${s.year.tg}${s.year.dz} ${s.month.tg}${s.month.dz} ${s.day.tg}${s.day.dz} ${s.hour.tg}${s.hour.dz}`;
          if (p.base_info?.zhengge) ctx.zhengge = p.base_info.zhengge;
          if (p.base_info?.qiyun) ctx.qiyun = p.base_info.qiyun;
          if (p.detail_info?.sizhu?.day) ctx.rizhu = `${p.detail_info.sizhu.day.tg}${p.detail_info.sizhu.day.dz}日元`;
          const currentYear = new Date().getFullYear();
          const idx = (p.dayun_info?.big_start_year || []).findIndex(
            (y: number) => y <= currentYear && ((p.dayun_info.big_end_year || [])[p.dayun_info.big_start_year.indexOf(y)] || 9999) >= currentYear
          );
          if (idx >= 0) ctx.currentDayun = `当前大运：${p.dayun_info.big[idx]}（${p.dayun_info.big_god?.[idx] || ""}）`;
          hasCached = true;
        }
      }
      const cesuanCached = localStorage.getItem("yunshu:last-cesuan");
      if (cesuanCached) {
        const c = JSON.parse(cesuanCached);
        if (c.xiyongshen?.xiyongshen) ctx.xiyongshen = c.xiyongshen.xiyongshen;
        if (c.wuxing?.simple_desc) ctx.wuxing = c.wuxing.simple_desc;
      }

      if (!hasCached) {
        const result = await calculateBazi({ data: { name: r.name || "用户", gender: r.gender, birthDate: r.birthDate, birthTime: r.birthTime, calendar: r.calendar || "公历" } });
        if (result.success && result.data) {
          const p = result.data;
          try { localStorage.setItem("yunshu:last-paipan", JSON.stringify(p)); } catch { /* */ }
          if (p.detail_info?.sizhu) {
            const s = p.detail_info.sizhu;
            ctx.sizhu = `${s.year.tg}${s.year.dz} ${s.month.tg}${s.month.dz} ${s.day.tg}${s.day.dz} ${s.hour.tg}${s.hour.dz}`;
          }
          if (p.base_info?.zhengge) ctx.zhengge = p.base_info.zhengge;
          if (p.base_info?.qiyun) ctx.qiyun = p.base_info.qiyun;
          if (p.detail_info?.sizhu?.day) ctx.rizhu = `${p.detail_info.sizhu.day.tg}${p.detail_info.sizhu.day.dz}日元`;
        }
      }
    } catch { /* */ }

    setBaziCtx(ctx);
    setBaziLoading(false);
    setMessages([{ id: "w", role: "ai", content: `已切换到「${r.name}」的命盘（${r.gender}·${r.birthDate}）。\n八字：${ctx.sizhu || "已加载"}\n格局：${ctx.zhengge || "待分析"}\n\n有什么想了解的？` }]);
  }, []);

  const switchRole = useCallback((r: Role) => {
    setRole(r);
    setActiveRoleId(r.id);
    setRoleOpen(false);
    loadRoleBazi(r);
    toast(`已切换到 ${r.name} 的命盘`);
  }, [loadRoleBazi]);

  // 监听角色变更事件
  useEffect(() => {
    const handler = () => {
      setRoles(readRoles());
      const active = getActiveRole();
      if (active && active.id !== role?.id) {
        setRole(active);
        loadRoleBazi(active);
      }
    };
    window.addEventListener(ROLE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(ROLE_CHANGE_EVENT, handler);
  }, [role, loadRoleBazi]);

  // 首次加载时构建八字上下文 — 优先缓存，无缓存则主动请求 API
  useEffect(() => {
    if (!role) { setBaziLoading(false); return; }
    const ctx: Record<string, string> = {
      name: role.name,
      sex: role.gender === "男" ? "乾造" : "坤造",
      birthDate: role.birthDate,
      birthTime: role.birthTime,
    };

    // 尝试从 localStorage 获取缓存的排盘数据
    let hasCached = false;
    try {
      const cached = localStorage.getItem("yunshu:last-paipan");
      if (cached) {
        const p = JSON.parse(cached) as PaipanData;
        if (p.detail_info?.sizhu) {
          const s = p.detail_info.sizhu;
          ctx.sizhu = `${s.year.tg}${s.year.dz} ${s.month.tg}${s.month.dz} ${s.day.tg}${s.day.dz} ${s.hour.tg}${s.hour.dz}`;
          hasCached = true;
        }
        if (p.base_info?.zhengge) ctx.zhengge = p.base_info.zhengge;
        if (p.base_info?.qiyun) ctx.qiyun = p.base_info.qiyun;
        // 提取当前大运信息
        if (p.dayun_info?.big) {
          const currentYear = new Date().getFullYear();
          const idx = (p.dayun_info.big_start_year || []).findIndex(
            (y: number) => y <= currentYear && ((p.dayun_info.big_end_year || [])[p.dayun_info.big_start_year.indexOf(y)] || 9999) >= currentYear
          );
          if (idx >= 0) {
            ctx.currentDayun = `当前大运：${p.dayun_info.big[idx]}（${p.dayun_info.big_god?.[idx] || ""}）`;
          }
        }
        // 日柱信息
        if (p.detail_info?.sizhu?.day) {
          ctx.rizhu = `${p.detail_info.sizhu.day.tg}${p.detail_info.sizhu.day.dz}日元`;
        }
      }
      const cachedCesuan = localStorage.getItem("yunshu:last-cesuan");
      if (cachedCesuan) {
        const c = JSON.parse(cachedCesuan);
        if (c.xiyongshen?.xiyongshen) ctx.xiyongshen = c.xiyongshen.xiyongshen;
        if (c.wuxing?.simple_desc) ctx.wuxing = c.wuxing.simple_desc;
      }
    } catch { /* ignore */ }

    if (hasCached) {
      setBaziCtx(ctx);
      setBaziLoading(false);
      // 更新欢迎消息
      setMessages([{
        id: "w", role: "ai",
        content: `你好！我已加载「${role.name}」的命盘（${role.gender}·${role.birthDate}）。\n八字：${ctx.sizhu || "已加载"}\n格局：${ctx.zhengge || "待分析"}\n喜用神：${ctx.xiyongshen || "待分析"}\n\n今天想聊什么？`,
      }]);
      return;
    }

    // 无缓存 — 主动请求排盘 API
    setBaziLoading(true);
    calculateBazi({
      data: {
        name: role.name || "用户",
        gender: role.gender,
        birthDate: role.birthDate,
        birthTime: role.birthTime,
        calendar: role.calendar || "公历",
      },
    })
      .then((result) => {
        if (result.success && result.data) {
          const p = result.data;
          try { localStorage.setItem("yunshu:last-paipan", JSON.stringify(p)); } catch { /* ignore */ }
          if (p.detail_info?.sizhu) {
            const s = p.detail_info.sizhu;
            ctx.sizhu = `${s.year.tg}${s.year.dz} ${s.month.tg}${s.month.dz} ${s.day.tg}${s.day.dz} ${s.hour.tg}${s.hour.dz}`;
          }
          if (p.base_info?.zhengge) ctx.zhengge = p.base_info.zhengge;
          if (p.base_info?.qiyun) ctx.qiyun = p.base_info.qiyun;
          if (p.detail_info?.sizhu?.day) {
            ctx.rizhu = `${p.detail_info.sizhu.day.tg}${p.detail_info.sizhu.day.dz}日元`;
          }
          setMessages([{
            id: "w", role: "ai",
            content: `你好！我已为「${role.name}」排好命盘。\n八字：${ctx.sizhu || "已生成"}\n格局：${ctx.zhengge || "待分析"}\n\n我是 AI 命理师「枢机」，今天想聊什么？`,
          }]);
        }
      })
      .catch(() => { /* 失败不影响对话 */ })
      .finally(() => {
        setBaziCtx(ctx);
        setBaziLoading(false);
      });
  }, []);

  useEffect(() => { listRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    const um: Msg = { id: `u${Date.now()}`, role: "user", content: msg };
    setMessages(p => [...p, um]);
    setInput("");
    setSending(true);

    const history = messages.filter(m => m.id !== "w").map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

    try {
      const r = await sendChatMessage({ data: { message: msg, history, baziContext: baziCtx } });
      if (r.success) {
        setMessages(p => [...p, { id: `a${Date.now()}`, role: "ai", content: r.reply }]);
      } else {
        setMessages(p => [...p, { id: `e${Date.now()}`, role: "ai", content: `抱歉，${r.error || "AI 服务暂不可用"}` }]);
      }
    } catch {
      setMessages(p => [...p, { id: `e${Date.now()}`, role: "ai", content: "抱歉，网络出了点问题，请稍后重试。" }]);
    } finally { setSending(false); }
  }, [input, sending, messages, baziCtx]);

  const { listening, start: startVoice } = useVoiceInput({ onResult: (t) => { setInput(t); send(t); } });

  const quick = role
    ? (baziLoading ? ["命盘加载中，请稍候..."] : ["近期事业运势", "感情方面建议", "财运如何提升", "健康注意事项", "适合的行业方向"])
    : ["事业抉择", "感情困惑", "财运机会", "情绪调节"];

  return (
    <MobileShell hideNav>
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/90 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
          <div className="flex-1">
            <p className="font-serif-cn text-sm font-medium">枢机 · AI 命理师</p>
            <p className="text-[11px] text-muted-foreground">
              {baziLoading ? `正在加载「${role?.name}」命盘...` : (role ? `已绑定 · ${role.name}${baziCtx.sizhu ? " · 八字已加载" : ""}` : "通用模式 · 未绑定命盘")}
            </p>
          </div>
          <Link to="/" className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></Link>
        </div>
        {/* 角色切换 */}
        {roles.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => role?.id !== r.id && switchRole(r)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition ${
                  r.id === role?.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {r.avatar || ""} {r.name}
              </button>
            ))}
            {roles.length < 5 && (
              <Link to="/divine" className="shrink-0 rounded-full border border-dashed border-primary/40 px-3 py-1 text-[11px] text-primary">
                + 新增
              </Link>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 space-y-4 px-5 py-5 pb-28" ref={listRef}>
        <div className="text-center text-[11px] text-muted-foreground">{new Date().toLocaleDateString("zh-CN")}</div>
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">枢</div>}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-soft ${m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card"}`}>
              {m.role === "ai" ? <MarkdownText text={m.content} /> : m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">枢</div>
            <div className="rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-soft"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 bg-background/95 backdrop-blur md:max-w-[768px]">
        <div className="mx-5 mb-3 rounded-2xl bg-card/95 p-3 shadow-floating">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {quick.map(q => (
              <button key={q} onClick={() => send(q)} disabled={sending} className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-primary">{q}</button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2">
            <button type="button" onClick={startVoice} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${listening ? "bg-[var(--cinnabar)] text-white animate-pulse" : "bg-secondary text-primary"}`}><Mic className="h-4 w-4" /></button>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="问问命理师..." disabled={sending} className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
            <button type="submit" disabled={!input.trim() || sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}
