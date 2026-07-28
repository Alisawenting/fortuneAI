// 客户端认证状态管理 — localStorage + 事件驱动
// 遵循现有 roles.ts 的 Event 模式

export const AUTH_CHANGE_EVENT = "yunshu:auth-change";

const TOKEN_KEY = "yunshu:auth-token";
const USER_KEY = "yunshu:auth-user";

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  isMember?: boolean;
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  emit();
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emit();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit();
}

// 登录后同时保存 token 和 user 信息
export function saveAuth(token: string, user: AuthUser) {
  setToken(token);
  setStoredUser(user);
}

// 登出
export function logout() {
  clearToken();
}
