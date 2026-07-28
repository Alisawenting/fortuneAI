// 五行国风风景图 — 智谱 CogView AI 生成山水画卷
import { useRef, useState, useEffect } from "react";
import { Download, Share2, Sparkles, Loader2, RefreshCw, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { sendChatMessage } from "@/lib/api/chat.functions";
import { generateLandscape, proxyImage } from "@/lib/api/zhipu-image.functions";
import { MarkdownText } from "@/lib/utils";

interface ElementScores {
  wood: number; fire: number; earth: number; metal: number; water: number;
}

interface Props {
  scores: ElementScores;
  sizhuStr: string;
  rizhu: string;
  zhengge: string;
  name: string;
}

const ELEMENT_COLORS: Record<string, { primary: string; light: string; dark: string; name: string }> = {
  wood: { primary: "#4a7c59", light: "#7db88b", dark: "#2d5538", name: "木" },
  fire: { primary: "#c43a2f", light: "#e8685a", dark: "#8b1a12", name: "火" },
  earth: { primary: "#b89540", light: "#d4b860", dark: "#7a6328", name: "土" },
  metal: { primary: "#c4c0b8", light: "#ddd9d2", dark: "#8a857e", name: "金" },
  water: { primary: "#4a7d9e", light: "#6ea3c4", dark: "#2c5872", name: "水" },
};

export function ElementLandscape({ scores, sizhuStr, rizhu, zhengge, name }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [poem, setPoem] = useState("");
  const [poemLoading, setPoemLoading] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const dominantName = ELEMENT_COLORS[dominant[0]]?.name || "";
  const secondary = Object.entries(scores).sort((a, b) => b[1] - a[1])[1];
  const secondaryName = ELEMENT_COLORS[secondary[0]]?.name || "";

  // AI 生成山水画
  useEffect(() => {
    if (!sizhuStr || imageLoading) return;

    // 尝试从缓存加载
    const cacheKey = `yunshu:landscape-${sizhuStr.replace(/\s/g, "")}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { setAiImageUrl(cached); return; }
    } catch { /* ignore */ }

    setImageLoading(true);
    setImageError(false);

    generateLandscape({
      data: {
        dominantElement: dominantName,
        secondaryElement: secondaryName,
        scores,
        sizhuStr,
        rizhu,
        zhengge,
      },
    })
      .then((r) => {
        if (r.success) {
          setAiImageUrl(r.imageUrl);
          try { sessionStorage.setItem(cacheKey, r.imageUrl); } catch { /* ignore */ }
        } else {
          setImageError(true);
        }
      })
      .catch(() => setImageError(true))
      .finally(() => setImageLoading(false));
  }, [sizhuStr]);

  // 生成风景诗
  useEffect(() => {
    if (!sizhuStr) return;
    setPoemLoading(true);
    sendChatMessage({
      data: {
        message: `你是国风山水画诗人。请为这幅命理山水画题一首诗，用一段80字以内的诗意文字描述意境，语言简洁有意境：

八字：${sizhuStr}，日柱：${rizhu}，格局：${zhengge}
五行：木${scores.wood}分 火${scores.fire}分 土${scores.earth}分 金${scores.metal}分 水${scores.water}分
主导：${dominantName} 辅助：${secondaryName}

要求：把五行化作山水意象（木=林、火=日、土=山、金=石、水=溪），根据分数高低决定意象浓淡轻重。仅输出诗意文字，不加任何前缀。`,
        history: [],
        baziContext: { sizhu: sizhuStr },
      },
    })
      .then((r) => { if (r.success) setPoem(r.reply); })
      .catch(() => {})
      .finally(() => setPoemLoading(false));
  }, [sizhuStr]);

  // 通过服务器代理获取图片 dataUrl（绕过 CORS），然后合成题诗导出
  const renderExportCanvas = async (): Promise<string | null> => {
    if (!aiImageUrl) return null;
    try {
      // 通过服务器代理获取图片
      const proxyResult = await proxyImage({ data: { url: aiImageUrl } });
      if (!proxyResult.success) return null;

      // 创建画布
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // 加载图片
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = proxyResult.dataUrl;
      });

      // 画布尺寸（2x 导出）
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 添加题诗文字
      if (poem) {
        const fontSize = Math.max(18, img.width * 0.04);
        ctx.font = `400 ${fontSize}px "Noto Serif SC", serif`;
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "center";

        // 分行渲染
        const lines = poem.split(/\n/).filter(Boolean);
        const lineHeight = fontSize * 1.6;
        const startY = img.height * 0.08;
        lines.forEach((line, i) => {
          ctx.fillText(line.replace(/\*\*/g, "").replace(/\*/g, "").trim(), img.width / 2, startY + i * lineHeight);
        });
        ctx.shadowBlur = 0;
      }

      // 添加印章
      const sealSize = img.width * 0.08;
      const sealX = img.width - sealSize * 1.8;
      const sealY = img.height - sealSize * 2.2;
      ctx.fillStyle = "rgba(196, 58, 47, 0.25)";
      ctx.fillRect(sealX, sealY, sealSize, sealSize);
      ctx.strokeStyle = "#c43a2f";
      ctx.lineWidth = 2;
      ctx.strokeRect(sealX, sealY, sealSize, sealSize);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${sealSize * 0.5}px "Noto Serif SC", serif`;
      ctx.textAlign = "center";
      ctx.fillText(zhengge ? zhengge.slice(0, 2) : "枢", sealX + sealSize / 2, sealY + sealSize * 0.65);

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  // 导出图片
  const handleExport = async () => {
    if (!aiImageUrl) { toast.error("请等待 AI 图片生成完成"); return; }
    setExporting(true);
    try {
      const dataUrl = await renderExportCanvas();
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `云枢易馆_命理风景_${name}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("风景图已保存");
      } else {
        // 回退：直接下载原图
        const link = document.createElement("a");
        link.download = `云枢易馆_命理风景_原图_${name}.png`;
        link.href = aiImageUrl;
        link.target = "_blank";
        link.click();
        toast.success("已下载原图");
      }
    } catch {
      toast.error("保存失败，请长按图片保存");
    } finally {
      setExporting(false);
    }
  };

  // 分享
  const handleShare = async () => {
    if (!aiImageUrl) { toast.error("请等待 AI 图片生成完成"); return; }
    try {
      const dataUrl = await renderExportCanvas();
      if (dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], "landscape.png", { type: "image/png" })] })) {
          await navigator.share({ title: "我的八字命理风景 · 云枢易馆", files: [new File([blob], "landscape.png", { type: "image/png" })] });
          return;
        }
      }
      // 回退：复制链接
      await navigator.clipboard.writeText(aiImageUrl);
      toast("AI 风景图链接已复制");
    } catch {
      toast("分享暂不可用，请保存后分享");
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    const cacheKey = `yunshu:landscape-${sizhuStr.replace(/\s/g, "")}`;
    try { sessionStorage.removeItem(cacheKey); } catch { /* ignore */ }
    setAiImageUrl(null);
    setImageError(false);
  };

  return (
    <section className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--gold)_15%,transparent)] text-[var(--gold)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-serif-cn text-base font-medium">AI 命理风景图</p>
            <p className="text-[11px] text-muted-foreground">
              {imageLoading ? "智谱 CogView 正在绘制..." : aiImageUrl ? `${dominantName}山${secondaryName}水 · AI 生成` : `${dominantName}为主 · ${secondaryName}为辅`}
            </p>
          </div>
        </div>
        {aiImageUrl && (
          <button onClick={handleRegenerate} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground hover:text-primary">
            <RefreshCw className="h-3 w-3" /> 重绘
          </button>
        )}
      </div>

      {/* 画卷 */}
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-2xl border border-border/40 select-none"
        style={{
          width: "100%",
          aspectRatio: "3/4",
          background: "linear-gradient(180deg, #f7f2e6 0%, #ede4d3 30%, #e8dcc8 60%, #dfd3bb 100%)",
        }}
      >
        {/* 加载 / AI 图片 / 错误回退 */}
        {imageLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            <p className="font-serif-cn text-sm text-muted-foreground">智谱 AI 正在绘制国风山水...</p>
            <p className="text-[11px] text-muted-foreground">通常需要 5-15 秒</p>
          </div>
        ) : aiImageUrl ? (
          <img
            src={aiImageUrl}
            alt="AI 命理风景"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-serif-cn text-sm text-muted-foreground">AI 绘图暂不可用</p>
            <button onClick={handleRegenerate} className="rounded-full bg-primary/10 px-4 py-1.5 text-xs text-primary">点击重试</button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-serif-cn text-sm text-muted-foreground">准备生成...</p>
          </div>
        )}

        {/* 文字覆盖层 — 题诗 */}
        <div className="absolute top-4 left-0 right-0 px-5 z-10">
          <p className="font-serif-cn text-sm leading-6 text-center drop-shadow-md"
             style={{ color: aiImageUrl ? "#fff" : "#5c4a2a", textShadow: aiImageUrl ? "0 1px 4px rgba(0,0,0,0.6)" : undefined }}>
            {poemLoading ? (
              <span className="inline-flex items-center gap-1 opacity-70">
                <Loader2 className="h-3 w-3 animate-spin" /> 题诗中...
              </span>
            ) : poem ? (
              <MarkdownText text={poem} />
            ) : (
              <span className="opacity-50">{dominantName}山{secondaryName}韵 · {rizhu}</span>
            )}
          </p>
        </div>

        {/* 印章 */}
        <div className="absolute bottom-6 right-5 z-10 flex flex-col items-end gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-[#c43a2f] bg-[#c43a2f]/20 text-[10px] font-serif-cn text-white drop-shadow"
               style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
            {zhengge ? zhengge.slice(0, 2) : "枢"}
          </div>
          <p className="text-[9px] font-serif-cn text-white drop-shadow" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>云枢易馆</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={handleExport}
          disabled={exporting || (!aiImageUrl && !imageError)}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-sm font-medium shadow-soft active:scale-[0.98] disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "保存中..." : "保存风景图"}
        </button>
        <button
          onClick={handleShare}
          disabled={!aiImageUrl && !imageError}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-floating active:scale-[0.98] disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" /> 分享给好友
        </button>
      </div>
    </section>
  );
}
