import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, roleDescription, topics, expertise, tone, audience, intent, linkedinExp, writingRefs } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    const topicLabels = Array.isArray(topics) ? topics.join(', ') : ''
    const intentList = Array.isArray(intent) ? intent.join(', ') : ''

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an expert writing voice analyst. Based on professional survey data, synthesize a voice profile for LinkedIn content generation.

Return ONLY valid JSON with exactly this structure:
{
  "role": "concise job title extracted from their description",
  "company": "company name if mentioned in description, otherwise empty string",
  "tone": ["adjective1", "adjective2", "adjective3"],
  "sentence_style": "short|medium|long|mixed",
  "vocabulary": "conversational|professional|technical",
  "signature_phrases": ["phrase or pattern 1", "phrase or pattern 2", "phrase or pattern 3"],
  "topics": ["subject area 1", "subject area 2", "subject area 3"],
  "avoid": ["thing to avoid 1", "thing to avoid 2"],
  "raw_summary": "2-3 sentence description of how this person writes and what makes their voice distinctive."
}

Guidelines:
- tone: exactly 3 adjectives matching stated style preference and role
- sentence_style: infer from style ("direct" → "short", "analytical" → "medium", "conversational" → "mixed")
- vocabulary: infer from audience and role seniority
- signature_phrases: patterns this person likely uses given their expertise and style
- topics: combine their selected topics with what emerges from their expertise description
- avoid: things that would feel out of character given their stated style and goals
- raw_summary: plain English, written to guide an AI generating content in their voice

Return ONLY valid JSON. No markdown, no code blocks.`,
      messages: [
        {
          role: 'user',
          content: `Build a voice profile for ${name} based on their survey:

Role description: ${roleDescription || 'Not provided'}
Topics they cover: ${topicLabels || 'Not specified'}
What clients ask them repeatedly: ${expertise || 'Not provided'}
Communication style preference: ${tone || 'professional'}
Primary audience: ${audience?.primary || 'clients'}
Content goals (priority order): ${intentList || 'Not specified'}
LinkedIn experience/barriers: ${JSON.stringify(linkedinExp) || 'Not provided'}
Writing references they admire: ${writingRefs || 'None'}`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let voiceData: any
    try {
      voiceData = JSON.parse(rawText.trim())
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse voice analysis.' }, { status: 500 })
      }
      voiceData = JSON.parse(jsonMatch[0])
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        role: voiceData.role || 'Professional',
        company: voiceData.company || '',
        industry: 'Financial Services',
        voiceProfile: {
          create: {
            tone: voiceData.tone,
            sentenceStyle: voiceData.sentence_style,
            vocabulary: voiceData.vocabulary,
            signaturePhrases: voiceData.signature_phrases,
            topics: voiceData.topics,
            avoid: voiceData.avoid,
            rawSummary: voiceData.raw_summary,
            samples: [],
          },
        },
      },
    })

    return NextResponse.json({ userId: user.id })
  } catch (error) {
    console.error('process-capture error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
