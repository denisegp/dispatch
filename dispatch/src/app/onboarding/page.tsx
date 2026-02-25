'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INDUSTRIES = [
  'Financial Services',
  'Consulting',
  'Legal',
  'Commercial Real Estate',
]

interface UserInfo {
  name: string
  role: string
  company: string
  industry: string
}

interface VoiceProfile {
  id: string
  tone: string[]
  sentenceStyle: string
  vocabulary: string
  signaturePhrases: string[]
  topics: string[]
  avoid: string[]
  rawSummary: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Step 1 state
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    role: '',
    company: '',
    industry: 'Financial Services',
  })

  // Step 2 state
  const [samples, setSamples] = useState(['', '', '', '', ''])

  // Step 4 state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [userId, setUserId] = useState('')

  const updateSample = (index: number, value: string) => {
    setSamples((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const validSamples = samples.filter((s) => s.trim().length > 0)

  const handleAnalyze = async () => {
    setError('')
    setStep(3)
    try {
      const res = await fetch('/api/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInfo, samples: validSamples }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed.')
      }
      setVoiceProfile(data.voiceProfile)
      setUserId(data.userId)
      localStorage.setItem('dispatch_user_id', data.userId)
      localStorage.setItem('dispatch_user_name', userInfo.name)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStep(2)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-950 text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Dispatch</span>
          <span className="text-sm text-blue-300">Voice Onboarding</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-blue-950">
        <div className="max-w-3xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                    step > s
                      ? 'bg-blue-400 text-blue-950'
                      : step === s
                      ? 'bg-white text-blue-950'
                      : 'bg-blue-800 text-blue-400'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      step > s ? 'bg-blue-400' : 'bg-blue-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-blue-400">
            <span>Your Profile</span>
            <span>Writing Samples</span>
            <span>Analyzing</span>
            <span>Voice Profile</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Tell us about yourself</h1>
            <p className="text-slate-500 mb-8">
              This helps Dispatch understand your professional context when generating content.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  placeholder="e.g. Sarah Chen"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Job Title / Role
                </label>
                <input
                  type="text"
                  value={userInfo.role}
                  onChange={(e) => setUserInfo({ ...userInfo, role: e.target.value })}
                  placeholder="e.g. Senior Financial Advisor"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={userInfo.company}
                  onChange={(e) => setUserInfo({ ...userInfo, company: e.target.value })}
                  placeholder="e.g. Meridian Wealth Partners"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Industry
                </label>
                <select
                  value={userInfo.industry}
                  onChange={(e) => setUserInfo({ ...userInfo, industry: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!userInfo.name || !userInfo.role || !userInfo.company}
                className="px-6 py-2.5 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Writing Samples */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Add your writing samples</h1>
            <p className="text-slate-500 mb-8">
              Paste 3–5 of your existing LinkedIn posts or writing samples. Samples 1 and 2 are
              required. The more samples you provide, the better Dispatch captures your voice.
            </p>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {samples.map((sample, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Sample {i + 1}
                    {i < 2 ? (
                      <span className="ml-1.5 text-red-500">*</span>
                    ) : (
                      <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
                    )}
                  </label>
                  <textarea
                    value={sample}
                    onChange={(e) => updateSample(i, e.target.value)}
                    rows={5}
                    placeholder={`Paste your ${i < 2 ? '' : 'optional '}LinkedIn post or writing sample here...`}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 text-slate-600 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={validSamples.length < 2}
                className="px-6 py-2.5 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Analyze My Voice →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Loading */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-blue-600 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyzing your voice...</h2>
            <p className="text-slate-500 max-w-sm">
              Dispatch is reading your writing samples to understand your tone, sentence style, and
              signature patterns. This takes about 10 seconds.
            </p>
          </div>
        )}

        {/* STEP 4: Voice Profile Confirmation */}
        {step === 4 && voiceProfile && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  {userInfo.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Your Voice Profile is Ready
                  </h1>
                  <p className="text-sm text-slate-500">
                    {userInfo.name} · {userInfo.role} · {userInfo.company}
                  </p>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed mb-8 text-sm bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                {voiceProfile.rawSummary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Tone
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {voiceProfile.tone.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Writing Style
                  </h3>
                  <div className="flex gap-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium capitalize">
                      {voiceProfile.sentenceStyle} sentences
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium capitalize">
                      {voiceProfile.vocabulary} vocabulary
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Signature Phrases
                  </h3>
                  <ul className="space-y-2">
                    {voiceProfile.signaturePhrases.map((phrase) => (
                      <li key={phrase} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-blue-500 mt-0.5">›</span>
                        <span className="italic">&ldquo;{phrase}&rdquo;</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Topics You Write About
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {voiceProfile.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Avoid
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {voiceProfile.avoid.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/draft?userId=${userId}`)}
                className="flex-1 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Generate Your First Post →
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-5 py-3 text-slate-600 font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
