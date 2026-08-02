import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Sparkles, Wand2, Compass, ChevronLeft, HelpCircle, UserPlus, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { addRole, readRoles, getActiveRole, AVATAR_OPTIONS, MAX_ROLES } from "@/lib/roles";
import { calculateBazi } from "@/lib/api/yuanfenju.functions";
import { calculateZiwei } from "@/lib/ziwei/ziwei.functions";
import type { PaipanData } from "@/lib/api/yuanfenju.types";
import type { ZiweiChartData } from "@/lib/ziwei/types";
import { toast } from "sonner";

// ===== 出生日期：公历/农历共用的选项与工具 =====
const pad = (n: number) => String(n).padStart(2, "0");
const NOW_YEAR = new Date().getFullYear();
// 年份 1900 → 今年，近年在前
const YEAR_OPTIONS = Array.from({ length: NOW_YEAR - 1900 + 1 }, (_, i) => NOW_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const LUNAR_MONTHS = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
const CN_NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

function daysInSolarMonth(y: number, m: number) {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate(); // 该月最后一天（含闰年 2 月）
}

function lunarDayName(n: number) {
  if (n <= 10) return "初" + CN_NUM[n];
  if (n < 20) return "十" + CN_NUM[n - 10];
  if (n === 20) return "二十";
  if (n < 30) return "廿" + CN_NUM[n - 20];
  return "三十";
}

export const Route = createFileRoute("/divine")({
  head: () => ({
    meta: [
      { title: "AI 测算 · 云枢易馆" },
      { name: "description", content: "输入生辰，一键生成八字 / 紫微命盘，AI 智解流年运势。" },
    ],
  }),
  component: DivinePage,
});

function DivinePage() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<"男" | "女">("男");
  const [name, setName] = useState("");
  const [date, setDate] = useState("1995-08-12");
  const [time, setTime] = useState("07:20");
  const [place, setPlace] = useState("浙江省 杭州市");
  const [calendar, setCalendar] = useState<"公历" | "农历">("公历");
  const [saveAsRole, setSaveAsRole] = useState(false);
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [roleCount, setRoleCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 出生日期统一以 date 字符串（YYYY-MM-DD）为准，公历/农历共用同一套「年/月/日」选择器
  const [yy, mm, dd] = date.split("-").map(Number);
  const dayCount = calendar === "公历" ? daysInSolarMonth(yy, mm) : 30;

  const setYmd = (ny: number, nm: number, nd: number) => {
    const maxD = calendar === "公历" ? daysInSolarMonth(ny, nm) : 30;
    const day = Math.min(Math.max(1, nd), maxD);
    setDate(`${ny}-${pad(nm)}-${pad(day)}`);
  };

  // 切换历法时，若公历该月天数不足则收敛日期（如 2/30 → 2/28）
  const handleCalendarChange = (c: "公历" | "农历") => {
    setCalendar(c);
    if (c === "公历") {
      const maxD = daysInSolarMonth(yy, mm);
      if (dd > maxD) setDate(`${yy}-${pad(mm)}-${pad(maxD)}`);
    }
  };

  useEffect(() => {
    setRoleCount(readRoles().length);
    const a = getActiveRole();
    if (a) {
      setGender(a.gender);
      setDate(a.birthDate);
      if (a.calendar) setCalendar(a.calendar);
      setTime(a.birthTime);
      setPlace(a.birthPlace);
    }
  }, []);

  const handleGenerate = async (type: "bazi" | "ziwei") => {
    // 姓名始终必填（API 要求）
    const displayName = name.trim() || "用户";
    if (!name.trim()) {
      setName("用户");
    }

    // 如果勾选了保存为角色，先保存
    if (saveAsRole) {
      const res = addRole({ name: displayName, gender, birthDate: date, birthTime: time, birthPlace: place, calendar, avatar });
      if (!res.ok) {
        toast.error(res.reason || "保存失败");
        return;
      }
      toast.success(`已保存为角色 · ${displayName}`, { description: "可在首页运势模块切换查看" });
    }

    if (type === "ziwei") {
      setLoading(true);
      try {
        const result = await calculateZiwei({
          data: {
            name: displayName,
            gender,
            birthDate: date,
            birthTime: time,
            calendar,
          },
        });

        if (!result.success) {
          toast.error("紫微排盘失败", { description: result.error });
          return;
        }

        // 缓存排盘结果
        try { localStorage.setItem("yunshu:last-ziwei", JSON.stringify(result.data)); } catch { /* ignore */ }

        navigate({
          to: "/ziwei-chart",
          state: {
            chartData: result.data as ZiweiChartData,
            formData: { gender, birthDate: date, birthTime: time, calendar },
          } as any,
        });
      } catch (err) {
        toast.error("网络错误", { description: (err as Error).message });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const result = await calculateBazi({
        data: {
          name: displayName,
          gender,
          birthDate: date,
          birthTime: time,
          calendar,
        },
      });

      if (!result.success) {
        toast.error("排盘失败", { description: result.error });
        return;
      }

      // 缓存排盘结果到 localStorage（供 AI 对话使用）
      try { localStorage.setItem("yunshu:last-paipan", JSON.stringify(result.data)); } catch { /* ignore */ }

      // 通过 router state 传递排盘数据
      navigate({
        to: "/chart",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: {
          paipanData: result.data as PaipanData,
          formData: { gender, birthDate: date, birthTime: time, birthPlace: place, calendar },
        } as any,
      });
    } catch (err) {
      toast.error("网络错误", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const full = roleCount >= MAX_ROLES;

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5 pt-10 pb-3">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif-cn text-base font-medium">个人命盘录入</p>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
        </button>
      </header>

      <div className="scroll-paper mx-5 mt-2 rounded-3xl p-5 shadow-soft">
        <p className="font-serif-cn text-xl">枢机将启</p>
        <p className="mt-1 text-xs text-muted-foreground">填四项即可，未知时辰也能智能估算</p>
      </div>

      <form className="mx-auto w-full max-w-lg space-y-4 px-5 py-6" onSubmit={(e) => e.preventDefault()}>
        <Field label="性别">
          <div className="flex gap-2">
            {(["男", "女"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 rounded-2xl border py-3 text-sm font-serif-cn ${
                  gender === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                }`}
              >
                {g === "男" ? "乾 · 男" : "坤 · 女"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="姓名">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名（必填）"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="历法">
          <div className="flex gap-2">
            {(["公历", "农历"] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => handleCalendarChange(c)}
                className={`flex-1 rounded-2xl border py-2.5 text-xs ${
                  calendar === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`出生日期（${calendar}）`}>
          <div className="grid grid-cols-3 gap-2">
            <DateSelect
              value={yy || NOW_YEAR}
              onChange={(v) => setYmd(v, mm, dd)}
              options={YEAR_OPTIONS}
              render={(v) => `${v}年`}
            />
            <DateSelect
              value={mm || 1}
              onChange={(v) => setYmd(yy, v, dd)}
              options={MONTH_OPTIONS}
              render={(v) => (calendar === "农历" ? LUNAR_MONTHS[v - 1] : `${v}月`)}
            />
            <DateSelect
              value={Math.min(dd || 1, dayCount)}
              onChange={(v) => setYmd(yy, mm, v)}
              options={Array.from({ length: dayCount }, (_, i) => i + 1)}
              render={(v) => (calendar === "农历" ? lunarDayName(v) : `${v}日`)}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {calendar === "农历"
              ? "已按农历（阴历）录入，年月日均可选到近年；如不确定可切换公历"
              : "已按公历（阳历）录入，天数随月份/闰年自动调整"}
          </p>
        </Field>

        <Field label="出生时间">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
            <button type="button" className="rounded-2xl border border-dashed border-primary/50 px-3 text-xs text-primary">
              智能估算
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">将自动进行真太阳时校正</p>
        </Field>

        <Field label="出生地点">
          <input
            value={place} onChange={(e) => setPlace(e.target.value)}
            placeholder="如：浙江省 杭州市"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        {/* 保存为角色 */}
        <div className={`rounded-2xl border p-4 ${saveAsRole ? "border-primary/60 bg-primary/5" : "border-border bg-card"}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsRole}
              disabled={full}
              onChange={(e) => setSaveAsRole(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">保存为角色档案</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${full ? "bg-[color-mix(in_oklab,var(--cinnabar)_15%,transparent)] text-[var(--cinnabar)]" : "bg-secondary text-muted-foreground"}`}>
                  {roleCount}/{MAX_ROLES}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {full ? "角色已满，请先在「会员中心」删除一个" : "此次测算将存档为新角色，首页可一键切换查看"}
              </p>
            </div>
          </label>

          {saveAsRole && !full && (
            <div className="mt-3 space-y-3">
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="角色名称，如：宝宝、爸爸、伴侣"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              <div>
                <p className="mb-1.5 text-[11px] text-muted-foreground">选择头像</p>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_OPTIONS.map((a) => (
                    <button
                      key={a} type="button" onClick={() => setAvatar(a)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
                        avatar === a ? "bg-primary/15 ring-2 ring-primary" : "bg-muted"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleGenerate("bazi")}
            disabled={loading}
            className="flex flex-col items-center gap-1 rounded-2xl bg-primary py-4 text-primary-foreground shadow-floating active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
            <span className="font-serif-cn text-sm font-medium">{loading ? "排盘中..." : "生成八字命盘"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleGenerate("ziwei")}
            className="flex flex-col items-center gap-1 rounded-2xl border border-primary bg-card py-4 text-primary active:scale-[0.98]"
          >
            <Compass className="h-5 w-5" />
            <span className="font-serif-cn text-sm font-medium">生成紫微命盘</span>
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            数据仅用于命理推演，受加密保护，可随时一键清空
          </div>
        </div>
      </form>
    </MobileShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// 公历/农历共用的单个下拉列（年 / 月 / 日），原生 select 在各设备上体验一致
function DateSelect({
  value,
  onChange,
  options,
  render,
}: {
  value: number;
  onChange: (v: number) => void;
  options: number[];
  render: (v: number) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none rounded-2xl border border-border bg-card py-3 pl-3 pr-7 text-sm focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {render(o)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
