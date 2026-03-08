import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const drafts = await prisma.draft.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, company: true } },
        sourcePost: { select: { id: true, title: true, tags: true } },
      },
      // scheduledFor is included by default via findMany
    })

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('drafts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts.' }, { status: 500 })
  }
}
