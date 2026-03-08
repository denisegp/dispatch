import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { content, status, scheduledFor } = body

    const updateData: { content?: string; status?: string; scheduledFor?: Date | null } = {}
    if (content !== undefined) updateData.content = content
    if (status !== undefined) updateData.status = status
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
    }

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const draft = await prisma.draft.findUnique({ where: { id }, select: { status: true } })
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })
    }
    if (draft.status === 'published') {
      return NextResponse.json({ error: 'Published drafts cannot be deleted.' }, { status: 403 })
    }

    await prisma.draft.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('draft DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete draft.' }, { status: 500 })
  }
}
