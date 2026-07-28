import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Heart, MessageSquare, Bookmark, Search, Plus, X, Send, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getPosts, createPost, toggleLike } from "@/lib/api/community.functions";
import { isLoggedIn, getToken } from "@/lib/auth/auth-store";
import { AuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "社区广场 · 云枢易馆" }, { name: "description", content: "国学同好交流社区。" }] }),
  component: CommunityPage,
});

const tabs = ["推荐", "运势心得", "命理科普", "国学知识", "生活感悟"];
type PostCategory = "运势心得" | "命理科普" | "国学知识" | "生活感悟";

// 后端返回的帖子结构（含作者信息与图片数组）
interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: number;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
}

function authorName(p: Post) {
  return p.displayName || p.username || "匿名";
}

function CommunityPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<PostCategory>("运势心得");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 4;

  // 从后端加载帖子（所有用户共享）
  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const category = activeTab === 0 ? undefined : tabs[activeTab];
      const res = await getPosts({ data: { category, page: 1, pageSize: 30 } });
      if (res.success) setPosts(res.posts as Post[]);
    } catch {
      /* 静默失败，保留已有列表 */
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - newImages.length;
    if (remaining <= 0) {
      toast.error(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }
    const toProcess = Math.min(files.length, remaining);
    for (let i = 0; i < toProcess; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`图片 ${file.name} 超过 5MB 限制`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          compressImage(base64, 800).then((compressed) => {
            setNewImages((prev) => {
              if (prev.length >= MAX_IMAGES) return prev;
              return [...prev, compressed];
            });
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 简单图片压缩（限制宽度）— 仅浏览器端可用
  function compressImage(base64: string, maxWidth: number): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        resolve(base64);
        return;
      }
      try {
        const img = new window.Image();
        img.onload = () => {
          try {
            if (img.width <= maxWidth) { resolve(base64); return; }
            const canvas = document.createElement("canvas");
            const ratio = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(base64); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } catch { resolve(base64); }
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
      } catch { resolve(base64); }
    });
  }

  const handleRemoveImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openEditor = () => {
    if (!isLoggedIn()) { setShowAuth(true); return; }
    setShowEditor(true);
  };

  // 点赞（走后端，需登录）
  const handleLike = async (id: string) => {
    if (!isLoggedIn()) { setShowAuth(true); return; }
    const wasLiked = likedPosts.has(id);
    // 乐观更新
    setLikedPosts((prev) => { const n = new Set(prev); if (wasLiked) n.delete(id); else n.add(id); return n; });
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likesCount: (p.likesCount || 0) + (wasLiked ? -1 : 1) } : p));
    try {
      const res = await toggleLike({ data: { postId: id, token: getToken() || undefined } });
      if (!res.success) throw new Error(res.error || "");
      setLikedPosts((prev) => { const n = new Set(prev); if (res.liked) n.add(id); else n.delete(id); return n; });
    } catch {
      // 回滚
      setLikedPosts((prev) => { const n = new Set(prev); if (wasLiked) n.add(id); else n.delete(id); return n; });
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likesCount: (p.likesCount || 0) + (wasLiked ? 1 : -1) } : p));
      toast.error("操作失败，请重试");
    }
  };

  // 发布帖子（走后端，需登录）
  const handlePublish = async () => {
    if (!isLoggedIn()) { setShowAuth(true); return; }
    if (!newTitle.trim()) { toast.error("请输入标题"); return; }
    if (!newContent.trim()) { toast.error("请输入内容"); return; }
    setPublishing(true);
    try {
      const res = await createPost({
        data: {
          category: newCategory,
          title: newTitle.trim(),
          content: newContent.trim(),
          images: newImages.length > 0 ? newImages : undefined,
          token: getToken() || undefined,
        },
      });
      if (res.success) {
        toast.success("发布成功！", { description: "你的帖子已发布到广场" });
        setShowEditor(false);
        setNewTitle(""); setNewContent(""); setNewImages([]);
        await loadFeed();
      } else {
        toast.error(res.error || "发布失败");
      }
    } catch {
      toast.error("网络错误，发布失败");
    } finally {
      setPublishing(false);
    }
  };

  const fmt = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  return (
    <MobileShell>
      <header className="px-5 pt-10">
        <div className="flex items-center justify-between">
          <p className="font-serif-cn text-xl font-semibold">广场</p>
          <div className="flex items-center gap-2">
            <button onClick={openEditor} className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm text-primary-foreground shadow-soft">
              <Plus className="h-4 w-4" /> 发帖
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"><Search className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} className={`shrink-0 rounded-full px-4 py-1.5 text-xs ${i === activeTab ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{t}</button>
          ))}
        </div>
      </header>

      <div className="px-5 py-4 [&>article]:mb-3 md:columns-2 md:gap-3 md:[&>article]:break-inside-avoid">
        {loading ? (
          <div className="py-16 text-center"><p className="font-serif-cn text-muted-foreground">加载中...</p></div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif-cn text-muted-foreground">还没有帖子，来发布第一条吧</p>
          </div>
        ) : posts.map(p => (
          <article key={p.id} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <Link to="/user/$name" params={{ name: authorName(p) }} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gradient-cinnabar)] text-xs text-primary-foreground">{p.avatar || authorName(p).slice(0, 1)}</Link>
              <div>
                <Link to="/user/$name" params={{ name: authorName(p) }} className="text-sm font-medium hover:text-primary transition-colors">{authorName(p)}</Link>
                <p className="text-[11px] text-muted-foreground">{p.category} · {fmt(p.createdAt)}</p>
              </div>
            </div>
            <p className="mt-3 font-serif-cn text-base">{p.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{p.content}</p>
            {/* 图片展示 */}
            {p.images && p.images.length > 0 && (
              <div className={`mt-2 grid gap-1.5 ${p.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {p.images.map((img, i) => (
                  <img
                    key={i}
                    src={img} alt={`${p.title} 图片${i + 1}`}
                    className="w-full rounded-xl object-cover border border-border/60 cursor-pointer hover:opacity-90 transition"
                    style={{ maxHeight: p.images.length === 1 ? "240px" : "160px" }}
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                  />
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
              <button onClick={() => handleLike(p.id)} className="flex items-center gap-1"><Heart className={`h-3.5 w-3.5 ${likedPosts.has(p.id) ? "fill-[var(--cinnabar)] text-[var(--cinnabar)]" : ""}`} /> {p.likesCount}</button>
              <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {p.commentsCount}</span>
              <span className="ml-auto flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" /> 收藏</span>
            </div>
          </article>
        ))}
      </div>

      {/* 图片预览灯箱 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewImage} alt="预览"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 发帖弹窗 */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center" onClick={() => setShowEditor(false)}>
          <div className="w-full max-w-[440px] rounded-t-3xl bg-card p-5 shadow-floating md:rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-serif-cn text-lg font-medium">发布帖子</p>
              <button onClick={() => setShowEditor(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-2 mb-3">
              {(["运势心得", "命理科普", "生活感悟", "国学知识"] as PostCategory[]).map(c => (
                <button key={c} onClick={() => setNewCategory(c)} className={`rounded-full px-3 py-1 text-xs ${newCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{c}</button>
              ))}
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="标题（必填）" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm mb-3 focus:border-primary focus:outline-none" />
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="分享你的运势心得、命理感悟..." rows={4} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm mb-3 focus:border-primary focus:outline-none resize-none" />

            {/* 图片选择与预览 */}
            {newImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {newImages.map((img, i) => (
                  <div key={i} className="relative shrink-0">
                    <img
                      src={img} alt={`图片${i + 1}`}
                      className="h-20 w-20 rounded-xl object-cover border border-border"
                      onClick={() => setPreviewImage(img)}
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cinnabar)] text-white shadow-sm"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <input
                ref={fileInputRef}
                type="file" accept="image/*" multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={newImages.length >= MAX_IMAGES}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition ${
                  newImages.length >= MAX_IMAGES
                    ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                    : "border-dashed border-primary/50 text-primary hover:bg-primary/5"
                }`}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {newImages.length >= MAX_IMAGES ? "图片已满" : "添加图片"}
              </button>
              <span className="text-[11px] text-muted-foreground">最多{MAX_IMAGES}张 · 自动压缩</span>
            </div>

            <button onClick={handlePublish} disabled={publishing} className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-60"><Send className="h-4 w-4" /> {publishing ? "发布中..." : "发布"}</button>
          </div>
        </div>
      )}

      {/* 登录 / 注册弹窗（未登录时发帖或点赞触发） */}
      <AuthModal open={showAuth} onOpenChange={setShowAuth} onSuccess={() => { setShowAuth(false); loadFeed(); }} />
    </MobileShell>
  );
}
