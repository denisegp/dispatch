import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'

export interface VoiceProfileData {
  tone: string[]
  sentence_style: string
  vocabulary: string
  signature_phrases: string[]
  topics: string[]
  avoid: string[]
  raw_summary: string
}

interface AnalyzeVoiceRequest {
  userInfo: {
    name: string
    role: string
    company: string
    industry: string
  }
  samples: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeVoiceRequest = await req.json()
    const { userInfo, samples } = body

    if (!userInfo?.name || !userInfo?.role || !userInfo?.company || !userInfo?.industry) {
      return NextResponse.json({ error: 'Missing required user info fields.' }, { status: 400 })
    }
    if (!samples || samples.length < 2) {
      return NextResponse.json({ error: 'At least 2 writing samples are required.' }, { status: 400 })
    }

    const samplesText = samples
      .map((s, i) => `Sample ${i + 1}:\n${s.trim()}`)
      .join('\n\n---\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an expert writing voice analyst. Analyze the provided writing samples and return a JSON object that captures the author's distinctive voice.

Return ONLY valid JSON with exactly this structure:
{
  "tone": ["adjective1", "adjective2", "adjective3"],
  "sentence_style": "short|medium|long|mixed",
  "vocabulary": "conversational|professional|technical",
  "signature_phrases": ["phrase or pattern 1", "phrase or pattern 2"],
  "topics": ["subject area 1", "subject area 2"],
  "avoid": ["word or style to avoid 1", "word or style to avoid 2"],
  "raw_summary": "2-3 sentence plain English description of how this person writes."
}

Guidelines:
- tone: exactly 3 adjectives that capture the emotional quality of the writing
- sentence_style: one of "short", "medium", "long", or "mixed"
- vocabulary: one of "conversational", "professional", or "technical"
- signature_phrases: up to 5 distinctive phrases, sentence openers, or structural patterns this person uses
- topics: subject areas they write about based on the samples
- avoid: words, phrases, or stylistic choices that feel out of character given their samples
- raw_summary: a concise, accurate description of their writing style

Return ONLY valid JSON. No markdown, no explanation, no code blocks.`,
      messages: [
        {
          role: 'user',
          content: `Analyze the writing voice in these samples from ${userInfo.name}, a ${userInfo.role} at ${userInfo.company} in the ${userInfo.industry} industry:\n\n${samplesText}`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let voiceData: VoiceProfileData
    try {
      voiceData = JSON.parse(rawText.trim())
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse voice analysis response.' }, { status: 500 })
      }
      voiceData = JSON.parse(jsonMatch[0])
    }

    const user = await prisma.user.create({
      data: {
        name: userInfo.name,
        role: userInfo.role,
        company: userInfo.company,
        industry: userInfo.industry,
        voiceProfile: {
          create: {
            tone: voiceData.tone,
            sentenceStyle: voiceData.sentence_style,
            vocabulary: voiceData.vocabulary,
            signaturePhrases: voiceData.signature_phrases,
            topics: voiceData.topics,
            avoid: voiceData.avoid,
            rawSummary: voiceData.raw_summary,
            samples: samples,
          },
        },
      },
      include: { voiceProfile: true },
    })

    return NextResponse.json({
      userId: user.id,
      voiceProfile: user.voiceProfile,
    })
  } catch (error) {
    console.error('analyze-voice error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
