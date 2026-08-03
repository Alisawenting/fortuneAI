// GET /api/community/posts — 获取帖子列表
export default defineEventHandler(async () => {
  return { success: true, posts: [] };
});
