import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { content, status } = body

    const updateData: { content?: string; status?: string } = {}
    if (content !== undefined) updateData.content = content
    if (status !== undefined) updateData.status = status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const draft = await prisma.draft.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('draft PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update draft.' }, { status: 500 })
  }
}
