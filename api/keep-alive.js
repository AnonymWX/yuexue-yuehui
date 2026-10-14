// Vercel Cron 每天调用一次，ping Supabase 保持活跃
// 部署后由 vercel.json 里的 crons 配置自动触发

module.exports = async (req, res) => {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return res.status(500).json({
      error: 'Missing Supabase env vars',
      hasUrl: !!url,
      hasKey: !!key,
    })
  }

  const pingUrl = `${url}/rest/v1/lesson_progress?select=user_id&limit=1`

  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    const text = await response.text()
    console.log(`[keep-alive] ${new Date().toISOString()} status=${response.status} body=${text.slice(0, 100)}`)

    return res.status(200).json({
      ok: true,
      status: response.status,
      time: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[keep-alive] error:', e)
    return res.status(500).json({ error: String(e) })
  }
}
