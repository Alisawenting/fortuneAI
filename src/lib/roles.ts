// 角色档案管理 - 最多 5 个，localStorage 持久化
export type Role = {
  id: string;
  name: string;
  gender: "男" | "女";
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  birthPlace: string;
  calendar?: "公历" | "农历";
  avatar?: string; // emoji
  createdAt: number;
};

const KEY = "yunshu:roles";
const ACTIVE_KEY = "yunshu:active-role";
export const MAX_ROLES = 5;
export const ROLE_CHANGE_EVENT = "yunshu:roles-change";

const defaults: Role[] = [
  {
    id: "self",
    name: "我自己",
    gender: "男",
    birthDate: "1995-08-12",
    birthTime: "07:20",
    birthPlace: "浙江省 杭州市",
    calendar: "公历",
    avatar: "🌿",
    createdAt: 0,
  },
];

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  }
}

export function readRoles(): Role[] {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as Role[];
  } catch {
    return defaults;
  }
}

export function writeRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(roles));
  emit();
}

export function readActiveRoleId(): string {
  if (typeof window === "undefined") return defaults[0].id;
  return localStorage.getItem(ACTIVE_KEY) || defaults[0].id;
}

export function setActiveRoleId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, id);
  emit();
}

export function getActiveRole(): Role {
  const roles = readRoles();
  const id = readActiveRoleId();
  return roles.find((r) => r.id === id) || roles[0];
}

export function addRole(r: Omit<Role, "id" | "createdAt">): { ok: boolean; reason?: string; role?: Role } {
  const roles = readRoles();
  if (roles.length >= MAX_ROLES) {
    return { ok: false, reason: `最多保存 ${MAX_ROLES} 个角色，请先删除一个` };
  }
  const role: Role = {
    ...r,
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  writeRoles([...roles, role]);
  setActiveRoleId(role.id);
  return { ok: true, role };
}

export function removeRole(id: string) {
  const roles = readRoles().filter((r) => r.id !== id);
  writeRoles(roles);
  if (readActiveRoleId() === id && roles[0]) setActiveRoleId(roles[0].id);
}

export const AVATAR_OPTIONS = ["🌿", "🌸", "🐉", "🦊", "🌙", "⭐", "🔮", "🍀", "🪷", "🦋"];
