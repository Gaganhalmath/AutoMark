import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const rateLimit = checkRateLimit(ip)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const backendUrl = process.env.BACKEND_URL || 'https://automark-u7nr.onrender.com/api'
    const backendResponse = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: normalizedEmail, password }),
      cache: 'no-store',
    })
    const backendResult = await backendResponse.json().catch(() => ({}))
    if (!backendResponse.ok || !backendResult?.success || !backendResult?.data?.token) {
      return NextResponse.json(
        { error: backendResult?.message || 'Invalid backend credentials' },
        { status: backendResponse.status || 401 },
      )
    }
    const backendUser = backendResult.data.user

    // Create session cookie
    await createSession({
      userId: String(backendUser.id),
      email: backendUser.email,
      name: backendUser.name,
      role: backendUser.role,
      backendToken: backendResult.data.token,
    })

    return NextResponse.json({ success: true, redirect: '/admin/dashboard' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
