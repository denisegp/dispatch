import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

interface GenerateDraftRequest {
  userId: string
  topic: string
  rawNotes?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateDraftRequest = await req.json()
    const { userId, topic, rawNotes } = body

    if (!userId || !topic?.trim()) {
      return NextResponse.json({ error: 'userId and topic are required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { voiceProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }
    if (!user.voiceProfile) {
      return NextResponse.json(
        { error: 'This user has not completed voice onboarding.' },
        { status: 400 }
      )
    }

    const vp = user.voiceProfile

    const systemPrompt = `You are a LinkedIn ghostwriter. Write a LinkedIn post that sounds EXACTLY like the person described below — not generic AI, not a template.

VOICE PROFILE for ${user.name} (${user.role} at ${user.company}):
- Tone: ${vp.tone.join(', ')}
- Sentence style: ${vp.sentenceStyle} sentences
- Vocabulary level: ${vp.vocabulary}
- Signature phrases to weave in naturally (don't use all of them, pick what fits): ${vp.signaturePhrases.join(' | ')}
- Topics they write about: ${vp.topics.join(', ')}
- AVOID these words and styles: ${vp.avoid.join(', ')}

How they write: ${vp.rawSummary}

RULES:
- Match their sentence rhythm and paragraph length exactly
- Use their vocabulary level — not more formal or more casual
- Keep the post under 3000 characters (LinkedIn maximum)
- Do NOT add generic calls to action they wouldn't use
- Do NOT use hashtags unless they clearly match this person's style
- Do NOT start with "I" or a question unless their samples show that pattern
- Make it feel like this person sat down and wrote it themselves
- Return ONLY the post content — no quotes, no title, no explanation`

    const userMessage = `Write a LinkedIn post about: ${topic.trim()}${rawNotes?.trim() ? `\n\nRaw notes / bullet points to draw from:\n${rawNotes.trim()}` : ''}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    if (!content) {
      return NextResponse.json({ error: 'Generation produced empty content.' }, { status: 500 })
    }

    const draft = await prisma.draft.create({
      data: {
        userId,
        content,
        topic: topic.trim(),
        status: 'draft',
      },
    })

    return NextResponse.json({ draftId: draft.id, content: draft.content })
  } catch (error) {
    console.error('generate-draft error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
