// POST /api/yuanfenju/cesuan — 八字测算
import { computeCesuan } from "@/lib/bazi/calculator";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const data = computeCesuan({
      name: body.name || "用户",
      sex: body.gender === "男" ? 1 : 0,
      type: body.calendar === "农历" ? 0 : 1,
      year: body.year, month: body.month, day: body.day,
      hours: body.hours, minute: body.minute,
    });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
