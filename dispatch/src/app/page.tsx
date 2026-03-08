import Link from 'next/link'
import { Mic, Layers, FileText, Shield, Share2, BarChart3, Check, X, ArrowRight } from 'lucide-react'

const BLUE = 'hsl(240 90% 35%)'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <header style={{ backgroundColor: BLUE }} className="sticky top-0 z-50 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6">
            <Link href="/draft" className="text-white text-sm hover:opacity-80 transition-opacity">
              Log in
            </Link>
            <Link
              href="/capture"
              className="bg-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: BLUE }}
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="gradient-hero px-8 pt-20 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center border border-white/40 rounded-full px-4 py-1.5 mb-10">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              Employee Thought Leadership Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-white font-black leading-none tracking-tight mb-8" style={{ fontSize: 'clamp(56px, 7vw, 96px)' }}>
            Turn expertise<br />into presence.
          </h1>

          {/* Subtext */}
          <p className="text-white/70 text-lg leading-relaxed max-w-xl mb-12">
            Dispatch captures how each professional actually thinks and speaks.
            Then helps them publish consistent, polished thought leadership — in
            their own voice.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-8">
            <Link
              href="/capture"
              className="inline-flex items-center gap-2 bg-white font-bold px-7 py-3.5 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: BLUE }}
            >
              Start free trial <ArrowRight size={16} />
            </Link>
            <Link href="/draft" className="text-white font-medium hover:opacity-80 transition-opacity">
              See it in action
            </Link>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="bg-white px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">The Problem</p>
          <h2 className="text-black font-black text-5xl leading-tight tracking-tight mb-16 max-w-3xl">
            Your best people have expertise. It&apos;s going nowhere.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left copy */}
            <div className="space-y-6">
              <p className="text-black font-bold text-xl leading-relaxed">
                Client-facing professionals who publish consistently generate inbound referrals and win mandates before the RFP is issued.
              </p>
              <p className="text-black font-bold text-xl leading-relaxed">
                The vast majority never publish. Revenue stays on the table every day.
              </p>
            </div>

            {/* Right cards */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <p className="font-bold text-black mb-2">No time. No workflow. Blank page.</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Client-facing professionals are billing hours, not drafting content.
                  The infrastructure to publish doesn&apos;t exist.
                </p>
              </div>
              <div className="rounded-2xl p-6" style={{ backgroundColor: '#f0f0f8' }}>
                <p className="font-bold text-black mb-2">The shadow AI problem.</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Your team is already using ChatGPT — pasting client data and deal terms into external tools.
                  Zero visibility. Zero audit trail. Dispatch closes that loop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section className="px-8 py-24" style={{ backgroundColor: '#f5f5fa' }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">A Complete Workflow</p>
          <h2 className="text-black font-black text-5xl leading-tight tracking-tight mb-4 max-w-3xl">
            From voice capture to publishing.<br />One message, many authentic voices.
          </h2>
          <p className="text-gray-400 text-base mb-16">Not another AI writing tool. A complete workflow.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Mic size={22} />,
                title: 'Voice Capture',
                desc: 'Extracts how each professional actually thinks from interviews and existing content. Not generic AI. Their voice.',
              },
              {
                icon: <Layers size={22} />,
                title: 'Content Cascade',
                desc: 'One master piece. Automatically adapted into each professional\'s individual tone. One message, dozens of authentic voices, zero extra effort.',
              },
              {
                icon: <FileText size={22} />,
                title: 'AI-Assisted Drafting',
                desc: 'Drafts in their authentic voice. Not output that sounds like everyone else.',
              },
              {
                icon: <Shield size={22} />,
                title: 'Compliance Workflow',
                desc: 'Pre-publication review with full audit trail. Built for FINRA, SEC, and FCA.',
              },
              {
                icon: <Share2 size={22} />,
                title: 'Multi-Channel Publishing',
                desc: 'LinkedIn, Substack, and press — each formatted correctly for the channel.',
              },
              {
                icon: <BarChart3 size={22} />,
                title: 'Revenue Attribution',
                desc: 'Track impressions, engagement, inbound leads, and mandate pipeline. ROI visible to revenue leadership.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="mb-6" style={{ color: BLUE }}>{icon}</div>
                <h3 className="font-bold text-black text-lg mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="bg-white px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">Why Dispatch</p>
          <h2 className="text-black font-black text-5xl leading-tight tracking-tight mb-16 max-w-2xl">
            Built for a problem the others don&apos;t solve.
          </h2>

          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-5 font-normal text-gray-400 w-1/3" />
                  <th className="p-5 font-medium text-gray-400 text-center">Grammarly</th>
                  <th className="p-5 font-medium text-gray-400 text-center">Writer</th>
                  <th className="p-5 font-medium text-gray-400 text-center">ChatGPT</th>
                  <th
                    className="p-5 font-bold text-white text-center rounded-t-xl"
                    style={{ backgroundColor: BLUE }}
                  >
                    Dispatch
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Voice preservation',
                  'External publishing',
                  'Compliance layer',
                  'Approval workflow',
                  'Personal brand incentive',
                ].map((feature, i) => (
                  <tr key={feature} className={i < 4 ? 'border-b border-gray-100' : ''}>
                    <td className="p-5 text-gray-700">{feature}</td>
                    <td className="p-5 text-center text-gray-300"><X size={16} className="mx-auto" /></td>
                    <td className="p-5 text-center text-gray-300"><X size={16} className="mx-auto" /></td>
                    <td className="p-5 text-center text-gray-300"><X size={16} className="mx-auto" /></td>
                    <td className="p-5 text-center" style={{ backgroundColor: '#f0f0f8' }}>
                      <Check size={16} className="mx-auto" style={{ color: BLUE }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-gray-400 text-sm italic mt-6">
            Writer has moved upmarket into enterprise AI agents competing with Salesforce. The mid-market is unclaimed.
          </p>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="gradient-hero px-8 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white font-black text-5xl leading-tight tracking-tight mb-6">
            Ready to turn expertise into presence?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Set up your voice profile in minutes. Generate your first post today.
          </p>
          <Link
            href="/capture"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
            style={{ color: BLUE }}
          >
            Start free trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  )
}

function Logo() {
  return (
    <span className="text-white text-2xl tracking-tight select-none">
      <span className="font-logo-serif">diS</span>
      <span className="font-bold">patch</span>
    </span>
  )
}
