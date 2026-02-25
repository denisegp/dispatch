import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-950 text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold tracking-tight">Dispatch</span>
            <span className="ml-3 text-blue-400 text-sm hidden sm:inline">
              Authentic thought leadership, at scale
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/onboarding" className="text-blue-300 hover:text-white transition-colors">
              Onboarding
            </Link>
            <Link href="/draft" className="text-blue-300 hover:text-white transition-colors">
              Draft
            </Link>
            <Link href="/cascade" className="text-blue-300 hover:text-white transition-colors">
              Cascade
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Your voice. Your ideas.
            <br />
            <span className="text-blue-700">LinkedIn content that sounds like you.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Dispatch captures your distinctive writing voice and uses it to generate LinkedIn posts
            that are authentic — not generic AI. Built for financial advisors, consultants, lawyers,
            and other client-facing professionals.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/onboarding" className="group">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 h-full flex flex-col hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Step 1</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Voice Onboarding</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Paste 3–5 writing samples and Dispatch analyzes your tone, sentence style,
                  signature phrases, and vocabulary to build your personal voice profile.
                </p>
              </div>
              <div className="mt-5 text-blue-700 text-sm font-semibold group-hover:text-blue-800 transition-colors">
                Set up your profile →
              </div>
            </div>
          </Link>

          <Link href="/draft" className="group">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 h-full flex flex-col hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Step 2</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Draft Generator</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Give Dispatch a topic and optional notes. It generates a LinkedIn post in your
                  exact voice — ready to edit, refine, and publish.
                </p>
              </div>
              <div className="mt-5 text-blue-700 text-sm font-semibold group-hover:text-blue-800 transition-colors">
                Generate a post →
              </div>
            </div>
          </Link>

          <Link href="/cascade" className="group">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 h-full flex flex-col hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Step 3</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2">Content Cascade</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Share one master message with your entire team. Dispatch generates a personalized
                  LinkedIn post for each person in their own voice — simultaneously.
                </p>
              </div>
              <div className="mt-5 text-blue-700 text-sm font-semibold group-hover:text-blue-800 transition-colors">
                Cascade to your team →
              </div>
            </div>
          </Link>
        </div>

        {/* Quick start banner */}
        <div className="mt-12 bg-blue-950 rounded-2xl px-8 py-7 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold mb-1">Ready to get started?</h3>
            <p className="text-blue-300 text-sm">
              A demo user (Alex Rivera) is pre-seeded. Jump straight to draft generation or cascade
              without going through onboarding.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/onboarding"
              className="px-5 py-2.5 bg-white text-blue-950 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              Start Onboarding
            </Link>
            <Link
              href="/draft"
              className="px-5 py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors text-sm border border-blue-600"
            >
              Generate Draft
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
