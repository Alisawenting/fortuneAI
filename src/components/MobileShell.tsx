import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, MessageCircle, Users, User } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";

const tabs = [
  { to: "/", label: "运势", icon: Home },
  { to: "/divine", label: "测算", icon: Sparkles },
  { to: "/chat", label: "问答", icon: MessageCircle },
  { to: "/community", label: "广场", icon: Users },
  { to: "/profile", label: "我的", icon: User },
];

export function MobileShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-muted/40 md:flex">
      {/* 桌面 / 平板：左侧固定侧边导航（<md 隐藏） */}
      {!hideNav && (
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-card/80 px-3 py-6 backdrop-blur-xl md:flex">
          <Link to="/" className="mb-7 flex items-center gap-2.5 px-2">
            <BrandMark size={36} />
            <div className="leading-tight">
              <p className="font-serif-cn text-base font-semibold tracking-wide">云枢易馆</p>
              <p className="text-[10px] text-muted-foreground">古法藏枢机 · AI 解流年</p>
            </div>
          </Link>
          <nav className="flex flex-col gap-1">
            {tabs.map((t) => {
              const active = pathname === t.to;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* 主内容区：手机满宽、桌面居中限宽（见 styles.css .phone-frame） */}
      <div className="min-w-0 flex-1">
        <div className="phone-frame flex flex-col">
          <main className={`flex-1 ${hideNav ? "" : "pb-24 md:pb-10"}`}>{children}</main>
        </div>

        {/* 手机：底部标签栏（md+ 隐藏，改用左侧侧栏） */}
        {!hideNav && (
          <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
            <ul className="mx-auto grid max-w-[440px] grid-cols-5">
              {tabs.map((t) => {
                const active = pathname === t.to;
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                      <span className={active ? "font-medium" : ""}>{t.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
