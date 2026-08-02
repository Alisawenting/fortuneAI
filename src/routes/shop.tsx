import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, ShoppingBag, Sparkles, Star, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "开运手串 · 云枢易馆" },
      { name: "description", content: "根据您的八字五行喜忌，AI 推荐合适的开运手串与饰品。" },
    ],
  }),
  component: ShopPage,
  validateSearch: (s: Record<string, unknown>) => ({
    element: typeof s.element === "string" ? s.element : "金水",
  }),
});

type Item = {
  id: string;
  name: string;
  element: string;
  desc: string;
  match: number;
  price: number;
  tag: string;
  color: string;
};

const items: Item[] = [
  { id: "1", name: "和田青玉 · 静水手串", element: "水", desc: "润而不烈，助身旺者泄秀，宜思虑过重之人", match: 96, price: 488, tag: "本命首推", color: "oklch(0.5 0.08 230)" },
  { id: "2", name: "天然砗磲 · 月华链", element: "金水", desc: "金水相生，清心安神，利文书与人际", match: 93, price: 326, tag: "贵人扶持", color: "oklch(0.92 0.02 250)" },
  { id: "3", name: "925 银嵌海蓝宝", element: "金水", desc: "金气清纯，助决断；海蓝宝润喉舌，化口舌", match: 90, price: 568, tag: "化口舌", color: "oklch(0.7 0.08 230)" },
  { id: "4", name: "白水晶 · 净心串", element: "金", desc: "平价入门款，纯净通透，平衡过旺土气", match: 85, price: 168, tag: "入门首选", color: "oklch(0.95 0.01 250)" },
  { id: "5", name: "黑曜石 · 镇煞链", element: "水", desc: "夜间或出差佩戴，挡煞辟邪", match: 82, price: 258, tag: "夜行护身", color: "oklch(0.25 0.01 250)" },
];

const avoid = [
  { name: "南红玛瑙", reason: "火气过旺，与日主不合，易加重燥意" },
  { name: "红玉髓", reason: "助火耗金，今年慎佩" },
];

function ShopPage() {
  const { element } = Route.useSearch();
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10">
        <Link to="/chart" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">开运商城 · 手串推荐</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft text-primary">
          <ShoppingBag className="h-4 w-4" />
        </span>
      </header>

      <div className="scroll-paper mx-5 mt-3 rounded-3xl p-5 shadow-soft">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI 已根据您的命盘喜用
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium">{element}</span> 挑选
        </div>
        <p className="mt-2 font-serif-cn text-base leading-7 text-foreground/85">
          您喜「{element}」，宜佩温润、清凉、明净之物；忌过燥过红。下列为本命匹配度最高的推荐。
        </p>
      </div>

      <section className="px-5 pt-5 space-y-3">
        {items.map((it) => (
          <article key={it.id} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex gap-3">
              <div
                className="h-20 w-20 shrink-0 rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 30%, ${it.color}, color-mix(in oklab, ${it.color} 60%, var(--card)))` }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif-cn text-sm font-medium leading-5">{it.name}</p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{it.tag}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{it.desc}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--gold)]">
                    <Star className="h-3 w-3 fill-current" /> 命盘契合 {it.match}%
                  </div>
                  <p className="font-serif-cn text-base text-[var(--cinnabar)]">¥{it.price}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast("功能开发中", { description: "真实商品链接功能正在开发，敬请期待！届时将支持一键跳转淘宝购买。" })}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/60 py-2.5 text-xs font-medium text-primary-foreground"
            >
              去商城查看 <Clock className="h-3 w-3" />
            </button>
          </article>
        ))}
      </section>

      <section className="mx-5 mt-6 rounded-2xl border border-dashed border-[var(--cinnabar)]/40 bg-[color-mix(in_oklab,var(--cinnabar)_6%,transparent)] p-4">
        <p className="font-serif-cn text-sm font-medium text-[var(--cinnabar)]">忌佩提示</p>
        <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
          {avoid.map((a) => (
            <li key={a.name}>· <span className="font-medium">{a.name}</span> — {a.reason}</li>
          ))}
        </ul>
      </section>

      <p className="px-5 py-5 text-center text-[11px] text-muted-foreground">命理推荐仅作参考，请理性消费</p>
    </MobileShell>
  );
}
