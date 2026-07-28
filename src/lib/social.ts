// 社交功能 — 关注/粉丝/好友（localStorage 实现）

const FOLLOWS_KEY = "yunshu:follows"; // { [userName]: string[] }

function readFollows(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeFollows(data: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(data));
}

// 关注某人
export function followUser(myName: string, targetName: string) {
  if (myName === targetName) return;
  const data = readFollows();
  if (!data[myName]) data[myName] = [];
  if (!data[myName].includes(targetName)) {
    data[myName] = [...data[myName], targetName];
    writeFollows(data);
  }
}

// 取消关注
export function unfollowUser(myName: string, targetName: string) {
  const data = readFollows();
  if (data[myName]) {
    data[myName] = data[myName].filter((n) => n !== targetName);
    writeFollows(data);
  }
}

// 是否已关注
export function isFollowing(myName: string, targetName: string): boolean {
  const data = readFollows();
  return data[myName]?.includes(targetName) || false;
}

// 我关注的人
export function getMyFollows(userName: string): string[] {
  return readFollows()[userName] || [];
}

// 我的粉丝（关注了我的人）
export function getMyFollowers(userName: string): string[] {
  const data = readFollows();
  const followers: string[] = [];
  for (const [u, follows] of Object.entries(data)) {
    if (follows.includes(userName)) followers.push(u);
  }
  return followers;
}

// 好友（互相关注）
export function getMyFriends(userName: string): string[] {
  const follows = new Set(getMyFollows(userName));
  const followers = new Set(getMyFollowers(userName));
  return [...follows].filter((f) => followers.has(f));
}

// 关注数
export function getFollowCount(userName: string): number {
  return getMyFollows(userName).length;
}

// 粉丝数
export function getFollowerCount(userName: string): number {
  return getMyFollowers(userName).length;
}

// 好友数
export function getFriendCount(userName: string): number {
  return getMyFriends(userName).length;
}
