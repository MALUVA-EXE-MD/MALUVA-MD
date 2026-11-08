import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const { number, server } = await req.json()
  let list = []
  try { list = JSON.parse(process.env.SERVERS || '[]') } catch {}
  const s = list[Number(server)]
  if (!s) return NextResponse.json({ error: 'Chagua seva kwanza' }, { status: 400 })
  try {
    const r = await fetch(`${s.url}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': process.env.API_SECRET },
      body: JSON.stringify({ number }),
      signal: AbortSignal.timeout(25000),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Seva haipatikani, jaribu nyingine' }, { status: 502 })
  }
}
