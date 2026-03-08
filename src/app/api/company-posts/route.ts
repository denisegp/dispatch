import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.companyPost.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('company-posts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch company posts.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, tags, priority, sourceUrl, fileName, sourceType } = body

    const parsedTags: string[] = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    if (!title?.trim() || !content?.trim() || parsedTags.length === 0) {
      return NextResponse.json(
        { error: 'title, content, and at least one tag are required.' },
        { status: 400 }
      )
    }

    const post = await prisma.companyPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags,
        priority: typeof priority === 'number' ? Math.max(0, Math.min(5, Math.round(priority))) : 0,
        sourceUrl: sourceUrl?.trim() || null,
        fileName: fileName?.trim() || null,
        sourceType: sourceType || 'manual',
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('company-posts POST error:', error)
    return NextResponse.json({ error: 'Failed to create company post.' }, { status: 500 })
  }
}
