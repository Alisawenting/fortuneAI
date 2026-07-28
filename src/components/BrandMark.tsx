export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-[var(--gradient-cinnabar)] text-primary-foreground shadow-soft"
      style={{ width: size, height: size, background: "var(--gradient-cinnabar)" }}
    >
      <span className="font-serif-cn text-lg font-semibold">枢</span>
    </div>
  );
}
