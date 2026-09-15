import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_URL || 'https://automark-u7nr.onrender.com/api'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.backendToken) return NextResponse.json({ message: 'Backend authentication is not available' }, { status: 401 })
  const response = await fetch(`${BACKEND_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.backendToken}` },
    body: await request.text(),
    cache: 'no-store',
  })
  const body = await response.json().catch(() => ({ message: 'Invalid backend response' }))
  return NextResponse.json(body, { status: response.status })
}
