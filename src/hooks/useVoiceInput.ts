// Web Speech API 语音输入 Hook — 中文识别
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseVoiceInputOptions {
  lang?: string;
  onResult: (text: string) => void;
}

export function useVoiceInput({ lang = "zh-CN", onResult }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;
  const [supported, setSupported] = useState(!!SR);
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!SR) {
      setSupported(false);
      toast.error("您的浏览器不支持语音输入", { description: "请使用 Chrome 或 Edge 浏览器" });
      return;
    }
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript || "";
        if (text.trim()) onResult(text.trim());
        setListening(false);
      };
      rec.onerror = (event: any) => {
        console.warn("[voice] recognition error:", event.error);
        toast.error("语音识别失败", { description: event.error === "no-speech" ? "未检测到语音" : "请重试" });
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setSupported(false);
      toast.error("语音功能不可用");
    }
  }, [lang, onResult, SR]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
