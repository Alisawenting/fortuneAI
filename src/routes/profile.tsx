import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import {
  Crown, ScrollText, MessageCircle, Image as ImageIcon, Settings,
  Shield, HelpCircle, ChevronRight, Calendar, Sparkles, LogOut,
  Users, UserPlus, Heart, FileText, BookmarkCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { isLoggedIn, logout, getStoredUser, AUTH_CHANGE_EVENT } from "@/lib/auth/auth-store";
import { AuthModal } from "@/components/AuthModal";
import type { AuthUser } from "@/lib/auth/auth-store";
import { getFollowCount, getFollowerCount, getFriendCount, getMyFollows, getMyFollowers, getMyFriends } from "@/lib/social";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "我的 · 云枢易馆" },
      { name: "description", content: "命盘管理、测算记录、会员中心与隐私管理。" },
    ],
  }),
  component: ProfilePage,
});

const groups: { title: string; items: { icon: LucideIcon; label: string; to: string; right?: string }[] }[] = [
  {
    title: "我的命理",
    items: [
      { icon: ScrollText, label: "我的命盘", to: "/chart", right: "戊辰日元" },
      { icon: Calendar, label: "测算记录", to: "/divine", right: "12 次" },
      { icon: MessageCircle, label: "AI 问答记录", to: "/chat", right: "36 条" },
      { icon: ImageIcon, label: "我的海报", to: "/community", right: "8 张" },
    ],
  },
  {
    title: "设置",
    items: [
      { icon: Settings, label: "通用设置", to: "/profile" },
      { icon: Shield, label: "隐私与数据管理", to: "/profile" },
      { icon: HelpCircle, label: "帮助中心", to: "/profile" },
    ],
  },
];

function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const myName = "我";

  // 社交数据
  const [myPostCount, setMyPostCount] = useState(0);
  const [myBookmarkCount, setMyBookmarkCount] = useState(0);
  const [followCount, setFollowCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setLoggedIn(isLoggedIn());
      setUser(getStoredUser());
    };
    update();
    window.addEventListener(AUTH_CHANGE_EVENT, update);

    // 加载社交数据
    try {
      const raw = localStorage.getItem("yunshu:community-posts");
      const all: { author: string }[] = raw ? JSON.parse(raw) : [];
      setMyPostCount(all.filter((p) => p.author === myName).length);
    } catch { /* ignore */ }
    try {
      const bm = localStorage.getItem("yunshu:bookmarkedPrompts");
      setMyBookmarkCount(bm ? JSON.parse(bm).length : 0);
    } catch { /* ignore */ }
    setFollowCount(getFollowCount(myName));
    setFollowerCount(getFollowerCount(myName));
    setFriendCount(getFriendCount(myName));

    return () => window.removeEventListener(AUTH_CHANGE_EVENT, update);
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <MobileShell>
      <div className="scroll-paper px-5 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-serif-cn text-primary-foreground shadow-soft" style={{ background: "var(--gradient-cinnabar)" }}>
            {user?.displayName?.slice(0, 1) || "云"}
          </div>
          <div className="flex-1">
            <p className="font-serif-cn text-lg font-semibold">
              {loggedIn && user ? user.displayName || user.username : "云客"}
            </p>
            <p className="text-xs text-muted-foreground">
              {loggedIn && user ? `@${user.username}` : "未登录"}
            </p>
            {loggedIn && user?.isMember ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-0.5 text-[11px] text-[var(--gold)]">
                <Crown className="h-3 w-3" /> 枢机会员
              </div>
            ) : !loggedIn ? (
              <button
                onClick={() => setShowAuth(true)}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
              >
                登录 / 注册
              </button>
            ) : null}
          </div>
        </div>

        {!loggedIn ? (
          <button
            onClick={() => setShowAuth(true)}
            className="mt-5 flex w-full items-center justify-between rounded-3xl bg-foreground/95 p-4 text-background shadow-floating"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-[var(--gold)]" />
              <div>
                <p className="font-serif-cn text-sm font-medium">登录云枢易馆</p>
                <p className="text-[11px] opacity-80">保存命盘 · AI 对话 · 社区互动</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/member"
            className="mt-5 flex items-center justify-between rounded-3xl bg-foreground/95 p-4 text-background shadow-floating"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-[var(--gold)]" />
              <div>
                <p className="font-serif-cn text-sm font-medium">开通枢机会员</p>
                <p className="text-[11px] opacity-80">无限 AI 问答 · 全场景深度解读</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="space-y-5 px-5">
        {/* 社交数据卡片 */}
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-serif-cn text-sm font-medium mb-4">社交</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Link to="/community" className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-xl font-semibold text-primary">{myPostCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">我的帖子</p>
            </Link>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-xl font-semibold text-primary">{myBookmarkCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">收藏</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-xl font-semibold text-primary">{friendCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">好友</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-secondary/40 p-3 text-center">
              <p className="text-lg font-semibold">{followCount}</p>
              <p className="text-[11px] text-muted-foreground">关注</p>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-3 text-center">
              <p className="text-lg font-semibold">{followerCount}</p>
              <p className="text-[11px] text-muted-foreground">粉丝</p>
            </div>
          </div>
          {/* 关注/粉丝列表 */}
          <div className="mt-3 space-y-2">
            <FollowList label="我关注的" names={getMyFollows(myName)} />
            <FollowList label="关注我的" names={getMyFollowers(myName)} />
            <FollowList label="我的好友" names={getMyFriends(myName)} />
          </div>
        </section>

        {groups.map((g) => (
          <section key={g.title}>
            <p className="mb-2 px-1 text-xs text-muted-foreground">{g.title}</p>
            <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
              {g.items.map((it, idx) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.label}
                    to={it.to}
                    className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm">{it.label}</span>
                    {it.right && <span className="text-xs text-muted-foreground">{it.right}</span>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {loggedIn && (
          <button
            onClick={handleLogout}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card py-3 text-sm text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> 退出登录
          </button>
        )}

        <div className="flex items-center justify-center gap-2 py-4 text-[11px] text-muted-foreground">
          <BrandMark size={20} />
          <span>云枢易馆 · 古法藏枢机，AI 解流年</span>
          <Sparkles className="h-3 w-3" />
        </div>
      </div>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </MobileShell>
  );
}

// 关注/粉丝/好友列表
function FollowList({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="rounded-xl bg-secondary/30 px-3 py-2">
      <p className="text-[10px] text-muted-foreground mb-1">{label}（{names.length}）</p>
      <div className="flex flex-wrap gap-1.5">
        {names.slice(0, 8).map((n) => (
          <Link
            key={n}
            to="/user/$name"
            params={{ name: n }}
            className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] hover:text-primary transition-colors"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px]">{n.slice(0, 1)}</span>
            {n}
          </Link>
        ))}
        {names.length > 8 && <span className="text-[11px] text-muted-foreground self-center">+{names.length - 8}</span>}
      </div>
    </div>
  );
}
