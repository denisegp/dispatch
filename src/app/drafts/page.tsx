'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const BLUE = 'hsl(240 90% 35%)'

function Logo() {
  return (
    <span className="text-white text-2xl tracking-tight select-none">
      <span className="font-logo-serif">diS</span>
      <span className="font-bold">patch</span>
    </span>
  )
}

interface Draft {
  id: string
  content: string
  topic: string
  status: string
  scheduledFor: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; role: string; company: string }
  sourcePost: { id: string; title: string; tags: string[] } | null
}

type StatusFilter = 'all' | 'draft' | 'approved' | 'published'

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleInput, setScheduleInput] = useState('')

  useEffect(() => {
    fetch('/api/drafts')
      .then((r) => r.json())
      .then((d) => setDrafts(d.drafts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) return
      setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status } : d))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setDrafts((prev) => prev.filter((d) => d.id !== id))
      setConfirmDeleteId(null)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSchedule = async (id: string) => {
    if (!scheduleInput) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: new Date(scheduleInput).toISOString() }),
      })
      if (!res.ok) return
      setDrafts((prev) => prev.map((d) =>
        d.id === id ? { ...d, scheduledFor: new Date(scheduleInput).toISOString() } : d
      ))
      setSchedulingId(null)
      setScheduleInput('')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleClearSchedule = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: null }),
      })
      if (!res.ok) return
      setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, scheduledFor: null } : d))
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === 'all' ? drafts : drafts.filter((d) => d.status === filter)

  const counts = {
    all: drafts.length,
    draft: drafts.filter((d) => d.status === 'draft').length,
    approved: drafts.filter((d) => d.status === 'approved').length,
    published: drafts.filter((d) => d.status === 'published').length,
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'draft',     label: 'Pending' },
    { key: 'approved',  label: 'Approved' },
    { key: 'published', label: 'Published' },
  ]

  // Min datetime for the schedule input (now)
  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ backgroundColor: BLUE }} className="text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/capture" className="text-white/70 hover:text-white transition-opacity">Onboarding</Link>
            <Link href="/posts" className="text-white/70 hover:text-white transition-opacity">Posts</Link>
            <Link href="/suggest" className="text-white/70 hover:text-white transition-opacity">Suggest</Link>
            <Link href="/draft" className="text-white/70 hover:text-white transition-opacity">Draft</Link>
            <Link href="/drafts" className="text-white font-medium border-b border-white/60 pb-0.5">Drafts</Link>
            <Link href="/cascade" className="text-white/70 hover:text-white transition-opacity">Cascade</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Drafts</h1>
          <p className="text-slate-500">Review, approve, schedule, and track all generated posts across your team.</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border border-slate-200 bg-white rounded-xl p-1 mb-6 w-fit shadow-sm">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                filter === key ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="h-4 bg-slate-100 rounded w-32" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 flex flex-col items-center text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400 text-sm">
              {filter === 'all' ? 'No drafts yet.' : `No ${filter} drafts.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((draft) => {
              const isExpanded = expandedId === draft.id
              const isConfirmingDelete = confirmDeleteId === draft.id
              const isScheduling = schedulingId === draft.id
              const isScheduled = draft.status === 'approved' && draft.scheduledFor

              return (
                <div key={draft.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {/* Status badge */}
                        {isScheduled ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(draft.scheduledFor!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : draft.status === 'draft' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                        ) : draft.status === 'approved' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Approved</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Published</span>
                        )}

                        <span className="text-sm font-medium text-slate-900">{draft.user.name}</span>
                        <span className="text-xs text-slate-400">{draft.user.role} · {draft.user.company}</span>
                        {draft.sourcePost && (
                          <span className="text-xs text-slate-400 truncate">
                            from <span className="text-slate-600">{draft.sourcePost.title}</span>
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Topic tags */}
                      {draft.topic && (
                        <div className="flex gap-1 flex-wrap mb-2">
                          {draft.topic.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <p className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {draft.content}
                      </p>
                      {draft.content.length > 200 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}

                      {/* Schedule picker (inline, below content) */}
                      {isScheduling && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <input
                            type="datetime-local"
                            min={minDatetime}
                            value={scheduleInput}
                            onChange={(e) => setScheduleInput(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleSchedule(draft.id)}
                            disabled={!scheduleInput || updatingId === draft.id}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => { setSchedulingId(null); setScheduleInput('') }}
                            className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions column */}
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {draft.status === 'draft' && (
                        <button
                          onClick={() => updateStatus(draft.id, 'approved')}
                          disabled={updatingId === draft.id}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-40 transition-colors"
                        >
                          Approve
                        </button>
                      )}

                      {draft.status === 'approved' && !isScheduled && (
                        <button
                          onClick={() => updateStatus(draft.id, 'published')}
                          disabled={updatingId === draft.id}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                        >
                          Mark Published
                        </button>
                      )}

                      {/* Schedule button — only for approved, not yet scheduled */}
                      {draft.status === 'approved' && !isScheduled && !isScheduling && (
                        <button
                          onClick={() => { setSchedulingId(draft.id); setScheduleInput('') }}
                          className="px-3 py-1.5 text-xs text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule
                        </button>
                      )}

                      {/* Clear schedule */}
                      {isScheduled && (
                        <button
                          onClick={() => handleClearSchedule(draft.id)}
                          disabled={updatingId === draft.id}
                          className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                        >
                          Clear schedule
                        </button>
                      )}

                      {draft.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(draft.id, 'draft')}
                          disabled={updatingId === draft.id}
                          className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                        >
                          Revert
                        </button>
                      )}

                      {/* Delete — not for published */}
                      {draft.status !== 'published' && (
                        isConfirmingDelete ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(draft.id)}
                              disabled={updatingId === draft.id}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(draft.id)}
                            className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
