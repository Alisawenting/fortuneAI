// yuanfenju.com API 服务端 HTTP 客户端
// 仅在 createServerFn handler 中使用，不会打包到客户端

import { getYuanfenjuConfig } from "../env.server";
import type { PaipanResponse, CesuanResponse, YunshiResponse } from "./yuanfenju.types";

export class YuanfenjuApiError extends Error {
  constructor(
    message: string,
    public errcode?: number,
    public status?: number,
  ) {
    super(message);
    this.name = "YuanfenjuApiError";
  }
}

function getConfig() {
  return getYuanfenjuConfig();
}

// 通用 POST 请求（form-urlencoded 格式，与 API 一致）
export async function yuanfenjuPost<T>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  const { apiBase, apiKey } = getConfig();
  const url = `${apiBase}${endpoint}`;

  // 构建 form-urlencoded body
  const body = new URLSearchParams();
  body.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    body.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: body.toString(),
    });
  } catch (err) {
    throw new YuanfenjuApiError(`网络请求失败: ${(err as Error).message}`, undefined);
  }

  if (!res.ok) {
    throw new YuanfenjuApiError(`HTTP ${res.status}`, undefined, res.status);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new YuanfenjuApiError(`非 JSON 响应 (HTTP ${res.status}): ${text.slice(0, 200)}`, undefined, res.status);
  }

  let json: { errcode: number; errmsg: string; data?: T; notice?: string };
  try {
    json = await res.json();
  } catch {
    throw new YuanfenjuApiError("响应 JSON 解析失败", -1);
  }

  if (json.errcode !== 0) {
    throw new YuanfenjuApiError(
      `API 业务错误 (${json.errcode}): ${json.errmsg}`,
      json.errcode,
    );
  }

  return json as unknown as T;
}

// 便捷方法
export async function paipan(params: {
  name?: string;
  sex: 0 | 1;
  type: 1 | 2;
  year: number;
  month: number;
  day: number;
  hours: number;
  minute: number;
}): Promise<PaipanResponse> {
  return yuanfenjuPost<PaipanResponse>("Bazi/paipan", {
    name: params.name || "",
    sex: params.sex,
    type: params.type,
    year: params.year,
    month: params.month,
    day: params.day,
    hours: params.hours,
    minute: params.minute,
  });
}

export async function cesuan(params: {
  name?: string;
  sex: 0 | 1;
  type: 1 | 2;
  year: number;
  month: number;
  day: number;
  hours: number;
  minute: number;
}): Promise<CesuanResponse> {
  return yuanfenjuPost<CesuanResponse>("Bazi/cesuan", {
    name: params.name || "",
    sex: params.sex,
    type: params.type,
    year: params.year,
    month: params.month,
    day: params.day,
    hours: params.hours,
    minute: params.minute,
  });
}

export async function yunshi(params: {
  name?: string;
  sex: 0 | 1;
  type: 1 | 2;
  year: number;
  month: number;
  day: number;
  hours: number;
  minute: number;
}): Promise<YunshiResponse> {
  return yuanfenjuPost<YunshiResponse>("Bazi/yunshi", {
    name: params.name || "",
    sex: params.sex,
    type: params.type,
    year: params.year,
    month: params.month,
    day: params.day,
    hours: params.hours,
    minute: params.minute,
  });
}
