import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, Crown, Check, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { simulatePayment, MEMBERSHIP_PLANS, SINGLE_PRODUCTS } from "@/lib/api/membership.functions";
import { isLoggedIn, getToken } from "@/lib/auth/auth-store";
import { AuthModal } from "@/components/AuthModal";
import { toast } from "sonner";

export const Route = createFileRoute("/member")({
  head: () => ({
    meta: [
      { title: "枢机会员 · 云枢易馆" },
      { name: "description", content: "无限 AI 问答、全场景深度解读、高清命理海报。" },
    ],
  }),
  component: MemberPage,
});

const plans = [
  { name: "月卡", price: "¥ 28", per: "/月", badge: "" },
  { name: "季卡", price: "¥ 68", per: "/季", badge: "限时 7 折" },
  { name: "年卡", price: "¥ 198", per: "/年", badge: "推荐" },
];

const rights = [
  "全场景深度 AI 解读（六大维度）",
  "无限次 AI 问答与语音咨询",
  "完整流年大运报告（含逐月提示）",
  "高清命理海报无限生成",
  "命盘记录与多人盘面收藏",
  "会员专属国学课程更新",
];

const single = [
  { name: "高阶专属命理报告", price: "¥ 39", desc: "万字深度长报告，含三年大运" },
  { name: "1V1 AI 深度咨询 · 30 分钟", price: "¥ 59", desc: "围绕一个核心议题深度推演" },
];

function MemberPage() {
  const [paying, setPaying] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const handlePayment = async (planType: "monthly" | "quarterly" | "yearly" | "single_report" | "single_consult") => {
    if (!isLoggedIn()) {
      setShowAuth(true);
      return;
    }
    setSelectedPlan(planType);
    setPaying(true);

    try {
      const result = await simulatePayment({ data: { planType, token: getToken() || undefined } });
      if (result.success) {
        toast.success("支付成功！", {
          description: result.membership
            ? `会员已开通，有效期至 ${new Date(result.membership.expiresAt).toLocaleDateString("zh-CN")}`
            : "服务已购买",
        });
      } else {
        toast.error("支付失败", { description: result.error });
      }
    } catch (err) {
      toast.error("网络错误", { description: "请稍后重试" });
    } finally {
      setPaying(false);
      setSelectedPlan("");
    }
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">枢机会员</p>
        <span className="w-9" />
      </header>

      <div className="mx-5 mt-4 rounded-3xl bg-foreground p-5 text-background shadow-floating">
        <div className="flex items-center gap-2 text-[var(--gold)]">
          <Crown className="h-4 w-4" />
          <span className="text-xs">枢机 · PRIME</span>
        </div>
        <p className="mt-3 font-serif-cn text-2xl">古法藏枢机</p>
        <p className="font-serif-cn text-xl opacity-80">AI 解流年</p>
        <p className="mt-3 text-xs opacity-70">解锁全部 AI 能力，让每一日都被认真对待。</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 px-5">
        {plans.map((p, i) => (
          <button
            key={p.name}
            onClick={() => handlePayment(i === 0 ? "monthly" : i === 1 ? "quarterly" : "yearly")}
            disabled={paying}
            className={`relative rounded-2xl border p-4 text-left ${
              i === 2
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            {p.badge && (
              <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                {p.badge}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{p.name}</p>
            <p className="mt-1 font-serif-cn text-lg font-semibold text-primary">{p.price}</p>
            <p className="text-[11px] text-muted-foreground">{p.per}</p>
          </button>
        ))}
      </div>

      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-serif-cn text-sm font-medium">会员权益</p>
        <ul className="mt-3 space-y-2.5">
          {rights.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 text-primary" /> {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-5 mt-5">
        <p className="mb-2 text-xs text-muted-foreground">单次精品</p>
        <div className="space-y-2">
          {single.map((s, idx) => (
            <button
              key={s.name}
              onClick={() => handlePayment(idx === 0 ? "single_report" : "single_consult")}
              disabled={paying}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-soft active:scale-[0.99]"
            >
              <Sparkles className="h-5 w-5 text-[var(--gold)]" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
              <span className="font-serif-cn text-sm text-primary">{s.price}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="px-5 pt-6 pb-2">
        <button
          onClick={() => handlePayment("yearly")}
          disabled={paying}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-floating disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {paying && selectedPlan === "yearly" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {paying && selectedPlan === "yearly" ? "处理中..." : "立即开通 · ¥ 198 / 年"}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          已阅读并同意《会员服务协议》《自动续费规则》
        </p>
      </div>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </MobileShell>
  );
}
