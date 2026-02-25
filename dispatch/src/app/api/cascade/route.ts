import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

interface CascadeRequest {
  masterContent: string
  userIds: string[]
  createdById: string
}

interface CascadeResult {
  userId: string
  draftId: string
  content: string
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: CascadeRequest = await req.json()
    const { masterContent, userIds, createdById } = body

    if (!masterContent?.trim()) {
      return NextResponse.json({ error: 'masterContent is required.' }, { status: 400 })
    }
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one team member.' }, { status: 400 })
    }
    if (!createdById) {
      return NextResponse.json({ error: 'createdById is required.' }, { status: 400 })
    }

    // Load all selected users with voice profiles
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, voiceProfile: { isNot: null } },
      include: { voiceProfile: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected users have completed voice onboarding.' },
        { status: 400 }
      )
    }

    // Create the cascade job first
    const cascadeJob = await prisma.cascadeJob.create({
      data: {
        masterContent: masterContent.trim(),
        status: 'running',
        createdById,
      },
    })

    // Generate posts in parallel for each user
    const generateForUser = async (
      user: (typeof users)[number]
    ): Promise<CascadeResult> => {
      const vp = user.voiceProfile!
      try {
        const systemPrompt = `You are a LinkedIn ghostwriter. Adapt the provided master content into a personalized LinkedIn post for a specific individual. Keep the core message intact but make it sound authentically like this person.

VOICE PROFILE for ${user.name} (${user.role} at ${user.company}):
- Tone: ${vp.tone.join(', ')}
- Sentence style: ${vp.sentenceStyle} sentences
- Vocabulary level: ${vp.vocabulary}
- Signature phrases to weave in naturally: ${vp.signaturePhrases.join(' | ')}
- Topics they write about: ${vp.topics.join(', ')}
- AVOID these words and styles: ${vp.avoid.join(', ')}

How they write: ${vp.rawSummary}

RULES:
- Preserve the core message and key points from the master content
- Rewrite it in this person's voice — their sentence rhythm, vocabulary, and patterns
- Add their perspective as a ${user.role} at ${user.company} where natural
- Keep under 3000 characters (LinkedIn maximum)
- Return ONLY the post content — no quotes, no title, no explanation`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Adapt this master content into a LinkedIn post:\n\n${masterContent.trim()}`,
            },
          ],
        })

        const content =
          message.content[0].type === 'text' ? message.content[0].text.trim() : ''

        const draft = await prisma.draft.create({
          data: {
            userId: user.id,
            content,
            topic: `Cascade: ${masterContent.trim().slice(0, 80)}${masterContent.trim().length > 80 ? '...' : ''}`,
            status: 'draft',
            cascadeJobId: cascadeJob.id,
          },
        })

        return { userId: user.id, draftId: draft.id, content }
      } catch (err) {
        console.error(`cascade generation failed for user ${user.id}:`, err)
        return {
          userId: user.id,
          draftId: '',
          content: '',
          error: 'Generation failed for this user.',
        }
      }
    }

    const results = await Promise.all(users.map(generateForUser))

    // Mark cascade job as complete
    await prisma.cascadeJob.update({
      where: { id: cascadeJob.id },
      data: { status: 'complete' },
    })

    // Attach user info to results for the UI
    const enrichedResults = results.map((r) => {
      const user = users.find((u) => u.id === r.userId)!
      return {
        ...r,
        userName: user.name,
        userRole: user.role,
        userCompany: user.company,
      }
    })

    return NextResponse.json({
      cascadeJobId: cascadeJob.id,
      results: enrichedResults,
    })
  } catch (error) {
    console.error('cascade error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
