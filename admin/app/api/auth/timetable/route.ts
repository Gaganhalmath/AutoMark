import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_URL || 'https://automark-u7nr.onrender.com/api'

async function requestBackend(path: string, init: RequestInit = {}) {
  const session = await getSession()
  if (!session?.backendToken) return NextResponse.json({ message: 'Backend authentication is not available' }, { status: 401 })
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.backendToken}`, ...(init.headers || {}) },
    cache: 'no-store',
  })
  const body = await response.json().catch(() => ({ message: 'Invalid backend response' }))
  return NextResponse.json(body, { status: response.status })
}

export async function GET(request: Request) {
  const query = new URL(request.url).search
  return requestBackend(`/timetable${query}`)
}

export async function POST(request: Request) {
  return requestBackend('/timetable/grid', { method: 'POST', body: await request.text() })
}
