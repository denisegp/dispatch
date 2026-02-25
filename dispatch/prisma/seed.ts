import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Clean existing demo data
  await prisma.draft.deleteMany({ where: { user: { name: 'Alex Rivera' } } })
  await prisma.voiceProfile.deleteMany({ where: { user: { name: 'Alex Rivera' } } })
  await prisma.user.deleteMany({ where: { name: 'Alex Rivera' } })

  const user = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      role: 'Senior Financial Advisor',
      company: 'Meridian Wealth Partners',
      industry: 'Financial Services',
      voiceProfile: {
        create: {
          tone: ['direct', 'confident', 'empathetic'],
          sentenceStyle: 'mixed',
          vocabulary: 'professional',
          signaturePhrases: [
            'Here\'s what most people get wrong:',
            'The math is simple, but the behavior isn\'t.',
            'I\'ve seen this play out hundreds of times.',
            'Let\'s be honest about what\'s really happening here.',
            'The uncomfortable truth is',
          ],
          topics: [
            'retirement planning',
            'portfolio diversification',
            'behavioral finance',
            'market volatility',
            'wealth building mindset',
            'financial independence',
          ],
          avoid: [
            'synergy',
            'leverage (as a buzzword)',
            'circle back',
            'touch base',
            'at the end of the day',
            'excessive exclamation marks',
            'vague motivational fluff',
          ],
          rawSummary:
            'Alex writes with the authority of a practitioner who has seen real outcomes — not a theorist. His posts tend to open with a provocative statement or counterintuitive observation, then back it with a specific example from client experience. He closes by giving the reader something actionable, never leaving them with just a diagnosis.',
          samples: [
            'Most investors think diversification means owning a lot of different things. It doesn\'t.\n\nI had a client come to me last year with 12 different mutual funds. He felt diversified. On paper, it looked diversified.\n\nEvery single one of those funds had Apple as a top-5 holding.\n\nTrue diversification is about correlation — not count. The math is simple, but the behavior isn\'t.\n\nHere\'s what I tell every new client: own things that go up for different reasons.',
            'The market dropped 4% yesterday. My phone hasn\'t stopped.\n\nMost of the calls aren\'t about the drop. They\'re about the feeling the drop is creating.\n\nI\'ve seen this play out hundreds of times. Fear isn\'t irrational — it\'s human. But it is expensive when it drives decisions.\n\nThe uncomfortable truth is: your biggest financial risk isn\'t market volatility. It\'s your own reaction to it.\n\nBuild a plan you can stick to when things feel worst. That\'s the whole game.',
          ],
        },
      },
    },
  })

  console.log(`✓ Created demo user: ${user.name} (${user.id})`)
  console.log(`  Role: ${user.role} at ${user.company}`)
  console.log(`  Industry: ${user.industry}`)
  console.log('\nDemo user ready. Use this ID to test draft generation and cascade:')
  console.log(`  User ID: ${user.id}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
