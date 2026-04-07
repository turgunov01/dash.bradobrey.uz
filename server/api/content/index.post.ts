export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return body || { ok: true }
})
