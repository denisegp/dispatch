import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { autoPost } = body

    const updateData: { autoPost?: boolean } = {}
    if (autoPost !== undefined) updateData.autoPost = autoPost

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('user PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 })
  }
}
