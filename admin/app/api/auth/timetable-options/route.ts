import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_URL || 'https://automark-u7nr.onrender.com/api'

export async function GET() {
  const session = await getSession()
  if (!session?.backendToken) return NextResponse.json({ message: 'Backend authentication is not available' }, { status: 401 })
  const headers = { Authorization: `Bearer ${session.backendToken}` }
  const responses = await Promise.all(['/departments', '/subjects', '/faculty', '/classes'].map((path) => fetch(`${BACKEND_URL}${path}`, { headers, cache: 'no-store' }).then(async (response) => ({ status: response.status, body: await response.json().catch(() => ({})) }))))
  const failed = responses.find((item) => item.status >= 400)
  if (failed) return NextResponse.json(failed.body, { status: failed.status })
  return NextResponse.json({ departments: responses[0].body.data || [], subjects: responses[1].body.data || [], faculty: responses[2].body.data || [], classes: responses[3].body.data || [] })
}
