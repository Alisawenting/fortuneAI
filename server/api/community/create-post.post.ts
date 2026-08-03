// POST /api/community/create-post — 发帖
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return { success: true, postId: "p" + Date.now() };
});
