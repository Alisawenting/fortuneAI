import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, UserPlus, UserCheck, Users, MessageSquare, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { followUser, unfollowUser, isFollowing, getFollowCount, getFollowerCount } from "@/lib/social";

interface Post {
  id: string; category: string; title: string; content: string;
  author: string; likes: number; comments: number; createdAt: number;
  images?: string[];
}

export const Route = createFileRoute("/user/$name")({
  component: UserPage,
});

function UserPage() {
  const { name } = Route.useParams();
  const decodedName = decodeURIComponent(name);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const myName = "我";

  useEffect(() => {
    // 加载该用户的所有帖子
    try {
      const raw = localStorage.getItem("yunshu:community-posts");
      const allPosts: Post[] = raw ? JSON.parse(raw) : [];
      setPosts(allPosts.filter((p) => p.author === decodedName));
    } catch { setPosts([]); }
    setFollowing(isFollowing(myName, decodedName));
  }, [decodedName]);

  const handleToggleFollow = () => {
    if (following) {
      unfollowUser(myName, decodedName);
      setFollowing(false);
      toast(`已取消关注 ${decodedName}`);
    } else {
      followUser(myName, decodedName);
      setFollowing(true);
      toast(`已关注 ${decodedName}`);
    }
  };

  const followCnt = getFollowCount(decodedName);
  const followerCnt = getFollowerCount(decodedName);

  const fmt = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <button onClick={() => window.history.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-serif-cn text-base font-medium">{decodedName} 的主页</p>
        <span className="w-9" />
      </header>

      {/* 用户信息卡 */}
      <div className="mx-5 mt-4 rounded-3xl bg-card p-5 shadow-soft text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
          {decodedName.slice(0, 1)}
        </div>
        <p className="mt-3 font-serif-cn text-lg font-medium">{decodedName}</p>
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span><span className="font-medium text-foreground">{posts.length}</span> 帖子</span>
          <span><span className="font-medium text-foreground">{followCnt}</span> 关注</span>
          <span><span className="font-medium text-foreground">{followerCnt}</span> 粉丝</span>
        </div>
        <button
          onClick={handleToggleFollow}
          className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-6 py-2 text-sm font-medium transition ${
            following
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground shadow-soft"
          }`}
        >
          {following ? <><UserCheck className="h-4 w-4" /> 已关注</> : <><UserPlus className="h-4 w-4" /> 关注</>}
        </button>
      </div>

      {/* 帖子列表 */}
      <div className="px-5 pt-5 pb-8">
        <p className="font-serif-cn text-sm font-medium mb-3">发布的帖子</p>
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-serif-cn text-muted-foreground">暂无帖子</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <article key={p.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{p.author.slice(0, 1)}</div>
                  <div>
                    <p className="text-sm font-medium">{p.author}</p>
                    <p className="text-[11px] text-muted-foreground">{p.category} · {fmt(p.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-3 font-serif-cn text-base">{p.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{p.content}</p>
                {p.images && p.images.length > 0 && (
                  <div className={`mt-2 grid gap-1.5 ${p.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {p.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-full rounded-xl object-cover border border-border/60" style={{ maxHeight: "160px" }} />
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {p.comments}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
