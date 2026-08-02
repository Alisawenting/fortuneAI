// React Query hooks — 紫微斗数
import { useMutation } from "@tanstack/react-query";
import { calculateZiwei, type ziweiInputSchema } from "@/lib/ziwei/ziwei.functions";
import type { z } from "zod";

type ZiweiInput = z.infer<typeof ziweiInputSchema>;

export function useZiweiCalculation() {
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: ZiweiInput): Promise<any> => {
      const result = await calculateZiwei({ data: input });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
