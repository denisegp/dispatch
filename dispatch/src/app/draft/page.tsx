'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface User {
  id: string
  name: string
  role: string
  company: string
  industry: string
  voiceProfile: { id: string } | null
}

interface DraftResult {
  draftId: string
  content: string
}

function DraftPageInner() {
  const searchParams = useSearchParams()
  const urlUserId = searchParams.get('userId')

  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [topic, setTopic] = useState('')
  const [rawNotes, setRawNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const charCount = (isEditing ? editedContent : draft?.content ?? '').length
  const LINKEDIN_MAX = 3000

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        const withVoice = (data.users as User[]).filter((u) => u.voiceProfile !== null)
        setUsers(withVoice)

        // Priority: URL param → localStorage → first user
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('dispatch_user_id') : null
        const preferredId = urlUserId || storedId
        if (preferredId && withVoice.find((u) => u.id === preferredId)) {
          setSelectedUserId(preferredId)
        } else if (withVoice.length > 0) {
          setSelectedUserId(withVoice[0].id)
        }
      } catch {
        setError('Failed to load users. Make sure the database is running.')
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [urlUserId])

  const handleGenerate = useCallback(async () => {
    if (!selectedUserId || !topic.trim()) return
    setError('')
    setDraft(null)
    setIsEditing(false)
    setSavedSuccess(false)
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, topic: topic.trim(), rawNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed.')
      setDraft(data)
      setEditedContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }, [selectedUserId, topic, rawNotes])

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setSavedSuccess(false)
    try {
      const content = isEditing ? editedContent : draft.content
      await fetch(`/api/drafts/${draft.draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, status: 'approved' }),
      })
      if (isEditing) {
        setDraft({ ...draft, content: editedContent })
        setIsEditing(false)
      }
      setSavedSuccess(true)
    } catch {
      setError('Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-950 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition-colors">
            Dispatch
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/onboarding" className="text-blue-300 hover:text-white transition-colors">
              Onboarding
            </Link>
            <Link href="/draft" className="text-white font-medium border-b border-blue-400 pb-0.5">
              Draft
            </Link>
            <Link href="/cascade" className="text-blue-300 hover:text-white transition-colors">
              Cascade
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Generate a Draft</h1>
          <p className="text-slate-500">
            Write a LinkedIn post in your authentic voice, powered by your voice profile.
          </p>
        </div>

        {/* User selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Writing as
          </label>
          {loadingUsers ? (
            <div className="flex items-center gap-3">
              <div className="w-48 h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-slate-500">
              No users with voice profiles found.{' '}
              <Link href="/onboarding" className="text-blue-600 hover:underline font-medium">
                Complete onboarding first →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <span className="text-sm text-slate-500">
                  {selectedUser.company} · {selectedUser.industry}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Post Brief</h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  What do you want to write about?{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Why most financial advisors are wrong about portfolio diversification"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Raw notes{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  rows={5}
                  placeholder="Dump bullet points, stats, anecdotes, or rough thoughts here. Claude will weave them into the post."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim() || !selectedUserId}
                  className="flex-1 py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : draft ? (
                    'Regenerate'
                  ) : (
                    'Generate Draft'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Result */}
          <div>
            {generating && !draft && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full min-h-64 flex flex-col gap-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                <div className="mt-2 h-4 bg-slate-100 rounded animate-pulse w-4/5" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            )}

            {draft && !generating && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Generated Post</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        charCount > LINKEDIN_MAX
                          ? 'bg-red-100 text-red-700'
                          : charCount > LINKEDIN_MAX * 0.9
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {charCount.toLocaleString()} / {LINKEDIN_MAX.toLocaleString()}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={14}
                    className="w-full px-4 py-3 rounded-lg border border-blue-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-blue-50"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3 min-h-40">
                    {draft.content}
                  </div>
                )}

                {charCount > LINKEDIN_MAX && (
                  <p className="text-xs text-red-600">
                    Post exceeds LinkedIn&apos;s 3,000 character limit. Please edit to shorten it.
                  </p>
                )}

                {savedSuccess && (
                  <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    Draft saved and approved successfully.
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditedContent(draft.content)
                        }}
                        className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setDraft({ ...draft, content: editedContent })
                          setIsEditing(false)
                        }}
                        className="px-4 py-2 text-sm text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Apply Edits
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setEditedContent(draft.content)
                      }}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="ml-auto px-5 py-2 text-sm text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-40 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Draft'
                    )}
                  </button>
                </div>
              </div>
            )}

            {!draft && !generating && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">
                  Your generated post will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftPageInner />
    </Suspense>
  )
}
