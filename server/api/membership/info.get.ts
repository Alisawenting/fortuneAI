// GET /api/membership/info — 会员信息
export default defineEventHandler(async () => {
  return { success: true, isMember: false, memberTier: "free", memberExpiresAt: null };
});
