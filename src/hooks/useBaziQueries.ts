// React Query hooks — 八字数据缓存
import { useMutation } from "@tanstack/react-query";
import { calculateBazi, analyzeBazi, getDailyFortune, type baziInputSchema } from "@/lib/api/yuanfenju.functions";
import type { z } from "zod";

type BaziInput = z.infer<typeof baziInputSchema>;

export function useBaziCalculation() {
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: BaziInput): Promise<any> => {
      const result = await calculateBazi({ data: input });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useBaziAnalysis() {
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: BaziInput): Promise<any> => {
      const result = await analyzeBazi({ data: input });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useDailyFortune() {
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: BaziInput): Promise<any> => {
      const result = await getDailyFortune({ data: input });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
