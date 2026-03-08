import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

interface CompanyPostRow {
  id: string
  title: string
  content: string
  tags: string[]
  priority: number
  sourceUrl: string | null
  sourceType: string
  fileName: string | null
  createdAt: Date
}

function pickBestPost(
  posts: CompanyPostRow[],
  userTopics: string[],
  excludePostId?: string
): CompanyPostRow | null {
  const available = excludePostId ? posts.filter((p) => p.id !== excludePostId) : posts
  if (available.length === 0) return null

  const normalizedUserTopics = userTopics.map((t) => t.toLowerCase())

  const scored = available.map((post) => {
    const postWords = post.tags.join(' ').toLowerCase().split(/[\s,]+/)
    const topicScore = postWords.filter((word) =>
      normalizedUserTopics.some((ut) => ut.includes(word) || word.includes(ut))
    ).length
    // Priority scales 0–5; multiply by large factor so it dominates topic matching
    const totalScore = post.priority * 100 + topicScore
    return { post, totalScore, topicScore }
  })

  scored.sort((a, b) => b.totalScore - a.totalScore)

  // If top result has no signal at all (priority 0, no topic match), pick randomly
  if (scored[0].totalScore === 0) {
    return available[Math.floor(Math.random() * available.length)]
  }

  return scored[0].post
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, excludePostId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
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

    const companyPosts = await prisma.companyPost.findMany({
      orderBy: { createdAt: 'desc' },
    })

    if (companyPosts.length === 0) {
      return NextResponse.json(
        { error: 'No company posts found. Add some posts to the library first.' },
        { status: 404 }
      )
    }

    const chosenPost = pickBestPost(companyPosts, user.voiceProfile.topics, excludePostId)

    if (!chosenPost) {
      return NextResponse.json(
        { error: 'No more company posts available to suggest.' },
        { status: 404 }
      )
    }

    const vp = user.voiceProfile

    const systemPrompt = `You are a LinkedIn ghostwriter. Your job is to rewrite a company's official post so it sounds EXACTLY like a specific individual wrote it from their own experience — not a corporate announcement, not generic AI, not a template.

VOICE PROFILE for ${user.name} (${user.role} at ${user.company}):
- Tone: ${vp.tone.join(', ')}
- Sentence style: ${vp.sentenceStyle} sentences
- Vocabulary level: ${vp.vocabulary}
- Signature phrases to weave in naturally (don't use all of them, pick what fits): ${vp.signaturePhrases.join(' | ')}
- Topics they write about: ${vp.topics.join(', ')}
- AVOID these words and styles: ${vp.avoid.join(', ')}

How they write: ${vp.rawSummary}

RULES:
- Keep the core message and key facts from the company post intact
- Rewrite it entirely in this person's voice — their sentence rhythm, vocabulary, and patterns
- Make it feel like ${user.name} is sharing a personal perspective on this topic, not forwarding a company announcement
- Add their professional lens as a ${user.role} at ${user.company} where it feels natural
- Do NOT copy company jargon or corporate phrasing unless this person would use it
- Keep under 3000 characters (LinkedIn maximum)
- Do NOT use hashtags unless they clearly match this person's style
- Return ONLY the post content — no quotes, no title, no explanation`

    const userMessage = `Rewrite this company post in my authentic personal voice:

COMPANY POST (tags: ${chosenPost.tags.join(', ')}):
${chosenPost.content}`

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
        topic: chosenPost.tags.join(', '),
        status: 'draft',
        sourcePostId: chosenPost.id,
      },
    })

    return NextResponse.json({
      draftId: draft.id,
      content: draft.content,
      companyPost: chosenPost,
    })
  } catch (error) {
    console.error('suggest-post error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
