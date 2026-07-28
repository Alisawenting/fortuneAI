// 登录 / 注册弹窗组件

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { login, register } from "@/lib/auth/auth.functions";
import { saveAuth } from "@/lib/auth/auth-store";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 重置表单
  useEffect(() => {
    if (!open) {
      setError("");
      setLoading(false);
      setPassword("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login({ data: { username, password } });
        if (result.success) {
          saveAuth(result.token, {
            id: result.user.id,
            username: result.user.username,
            displayName: result.user.displayName || undefined,
          });
          toast.success("登录成功", { description: `欢迎回来，${result.user.displayName || result.user.username}` });
          onOpenChange(false);
          onSuccess?.();
        } else {
          setError(result.error || "登录失败");
        }
      } else {
        const result = await register({
          data: {
            username,
            password,
            displayName: displayName || undefined,
          },
        });
        if (result.success) {
          saveAuth(result.token, {
            id: result.user.id,
            username: result.user.username,
            displayName: result.user.displayName || undefined,
          });
          toast.success("注册成功", { description: "欢迎加入云枢易馆" });
          onOpenChange(false);
          onSuccess?.();
        } else {
          setError(result.error || "注册失败");
        }
      }
    } catch (err) {
      setError((err as Error).message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif-cn text-center text-lg">
            {mode === "login" ? "登录云枢易馆" : "注册账号"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "login" ? "古法藏枢机，AI 解流年" : "创建账号以保存命盘和对话记录"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              minLength={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">昵称（选填）</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="如何称呼你？"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--cinnabar)] bg-[color-mix(in_oklab,var(--cinnabar)_8%,transparent)] rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "还没有账号？" : "已有账号？"}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="ml-1 text-primary hover:underline"
            >
              {mode === "login" ? "立即注册" : "去登录"}
            </button>
          </p>

          <p className="text-center text-[10px] text-muted-foreground">
            注册即表示同意《用户协议》和《隐私政策》
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
