'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
  company: string
  industry: string
  autoPost: boolean
  voiceProfile: { id: string } | null
}

interface CompanyPost {
  id: string
  title: string
  content: string
  tags: string[]
  priority: number
  sourceUrl: string | null
  sourceType: string
  fileName: string | null
}

interface SuggestResult {
  draftId: string
  content: string
  companyPost: CompanyPost
}

const LINKEDIN_MAX = 3000

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+(role|persona|instructions|system|prompt)/i,
  /act\s+as\s+(a|an)\s+/i,
  /forget\s+(everything|all|your)/i,
  /override\s+(your|the)\s+(instructions|rules|system)/i,
  /system\s*:\s*you/i,
  /<\s*system\s*>/i,
  /\[\s*system\s*\]/i,
]

export default function SuggestPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [result, setResult] = useState<SuggestResult | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [autoPost, setAutoPost] = useState(false)
  const [savingAutoPost, setSavingAutoPost] = useState(false)

  const [pendingDraftCount, setPendingDraftCount] = useState<number | null>(null)

  const [sourceCollapsed, setSourceCollapsed] = useState(false)

  const [refinementInput, setRefinementInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [refinementError, setRefinementError] = useState('')
  const [refinementHistory, setRefinementHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const displayContent = isEditing ? editedContent : result?.content ?? ''
  const charCount = displayContent.length

  useEffect(() => {
    fetch('/api/drafts?status=draft')
      .then((r) => r.json())
      .then((d) => setPendingDraftCount((d.drafts ?? []).length))
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        const withVoice = (data.users as User[]).filter((u) => u.voiceProfile !== null)
        setUsers(withVoice)

        const storedId = typeof window !== 'undefined' ? localStorage.getItem('dispatch_user_id') : null
        if (storedId && withVoice.find((u) => u.id === storedId)) {
          setSelectedUserId(storedId)
          const stored = withVoice.find((u) => u.id === storedId)
          if (stored) setAutoPost(stored.autoPost)
        } else if (withVoice.length > 0) {
          setSelectedUserId(withVoice[0].id)
          setAutoPost(withVoice[0].autoPost)
        }
      } catch {
        setError('Failed to load users.')
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) setAutoPost(selectedUser.autoPost)
  }, [selectedUser])

  const handleSuggest = async (excludePostId?: string) => {
    if (!selectedUserId) return
    setError('')
    setResult(null)
    setIsEditing(false)
    setSavedSuccess(false)
    setRefinementInput('')
    setRefinementError('')
    setRefinementHistory([])
    setSourceCollapsed(false)
    setGenerating(true)
    try {
      const res = await fetch('/api/suggest-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, excludePostId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed.')
      setResult(data)
      setEditedContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async (contentOverride?: string) => {
    if (!result) return
    setSaving(true)
    setSavedSuccess(false)
    try {
      const content = contentOverride ?? (isEditing ? editedContent : result.content)
      await fetch(`/api/drafts/${result.draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, status: 'approved' }),
      })
      if (isEditing) {
        setResult({ ...result, content: editedContent })
        setIsEditing(false)
      }
      setSavedSuccess(true)
    } catch {
      setError('Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoPostToggle = async (newValue: boolean) => {
    if (!selectedUserId) return
    setSavingAutoPost(true)
    try {
      await fetch(`/api/users/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPost: newValue }),
      })
      setAutoPost(newValue)
      setUsers((prev) => prev.map((u) => u.id === selectedUserId ? { ...u, autoPost: newValue } : u))
      if (newValue && result && !savedSuccess) {
        await handleApprove()
      }
    } catch {
      setError('Failed to update auto-post setting.')
    } finally {
      setSavingAutoPost(false)
    }
  }

  const handleRefine = async () => {
    if (!result || !refinementInput.trim()) return

    const trimmed = refinementInput.trim()

    if (trimmed.length > 300) {
      setRefinementError('Instruction must be 300 characters or fewer.')
      return
    }

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        setRefinementError('Instruction contains disallowed content. Please describe only the changes you want to the post.')
        return
      }
    }

    setRefinementError('')
    setRefining(true)
    const newHistory: { role: 'user' | 'assistant'; content: string }[] = [
      ...refinementHistory,
      { role: 'user', content: trimmed },
    ]
    setRefinementHistory(newHistory)
    setRefinementInput('')

    try {
      const res = await fetch('/api/suggest-post/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: result.draftId,
          currentContent: result.content,
          refinementPrompt: trimmed,
          history: refinementHistory,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Refinement failed.')

      if (data.type === 'revised') {
        setResult({ ...result, content: data.content })
        setEditedContent(data.content)
        setRefinementHistory([])
        setSavedSuccess(false)
      } else {
        // AI asked a clarifying question — add to thread
        setRefinementHistory([...newHistory, { role: 'assistant', content: data.content }])
      }
    } catch (err) {
      setRefinementError(err instanceof Error ? err.message : 'Something went wrong.')
      // Remove the optimistically-added user message on error
      setRefinementHistory(refinementHistory)
    } finally {
      setRefining(false)
    }
  }

  const sourceTypeLabel: Record<string, string> = { url: 'URL', file: 'File', manual: 'Manual' }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-950 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition-colors">
            Dispatch
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/capture" className="text-blue-300 hover:text-white transition-colors">
              Onboarding
            </Link>
            <Link href="/posts" className="text-blue-300 hover:text-white transition-colors">
              Posts
            </Link>
            <Link href="/suggest" className="text-white font-medium border-b border-blue-400 pb-0.5">
              Suggest
            </Link>
            <Link href="/draft" className="text-blue-300 hover:text-white transition-colors">
              Draft
            </Link>
            <Link href="/drafts" className="text-blue-300 hover:text-white transition-colors">
              Drafts
            </Link>
            <Link href="/cascade" className="text-blue-300 hover:text-white transition-colors">
              Cascade
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Suggested Post</h1>
          <p className="text-slate-500">
            The system picks the best company post for you and rewrites it in your authentic voice.
          </p>
        </div>

        {/* User selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Writing as</label>
          {loadingUsers ? (
            <div className="flex items-center gap-3">
              <div className="w-48 h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-32 h-10 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-slate-500">
              No users with voice profiles found.{' '}
              <Link href="/capture" className="text-blue-600 hover:underline font-medium">
                Complete onboarding first →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value)
                  setResult(null)
                  setError('')
                  setSavedSuccess(false)
                }}
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

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Pending drafts notice */}
        {pendingDraftCount !== null && pendingDraftCount > 0 && !result && !generating && (
          <Link
            href="/drafts"
            className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 mb-6 hover:bg-amber-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {pendingDraftCount} draft{pendingDraftCount !== 1 ? 's' : ''} pending review
                </p>
                <p className="text-xs text-amber-600">Previously generated posts are waiting to be approved.</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-amber-700 group-hover:text-amber-800 transition-colors shrink-0">
              Review drafts →
            </span>
          </Link>
        )}

        {/* Initial CTA */}
        {!result && !generating && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.9 3.9 0 00-1.14 2.66V17a1 1 0 01-1 1h-4a1 1 0 01-1-1v-.394a3.9 3.9 0 00-1.14-2.66l-.346-.347z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-1">Ready to generate your first suggestion?</p>
            <p className="text-slate-400 text-sm mb-6">
              We&apos;ll pick the best company post for your voice profile and adapt it.
            </p>
            <button
              onClick={() => handleSuggest()}
              disabled={!selectedUserId || loadingUsers}
              className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Get Suggestion
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {generating && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-24 mb-4" />
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-3 bg-slate-100 rounded" style={{ width: `${70 + (j % 3) * 10}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && !generating && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              {/* Left: Source post */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Source Post</span>
                    {result.companyPost.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {sourceTypeLabel[result.companyPost.sourceType] ?? result.companyPost.sourceType}
                    </span>
                  </div>
                  <button
                    onClick={() => setSourceCollapsed((v) => !v)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                  >
                    {sourceCollapsed ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Expand
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Collapse
                      </>
                    )}
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-3">{result.companyPost.title}</h3>
                {!sourceCollapsed && (
                  <>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3 h-52 overflow-y-auto">
                      {result.companyPost.content}
                    </div>
                    {result.companyPost.sourceUrl && (
                      <a
                        href={result.companyPost.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-3 inline-block truncate max-w-full"
                      >
                        {result.companyPost.sourceUrl}
                      </a>
                    )}
                  </>
                )}
              </div>

              {/* Right: Generated version */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Your Version — {selectedUser?.name}
                  </span>
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

                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-blue-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-blue-50 h-52"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg px-4 py-3 h-52 overflow-y-auto">
                    {result.content}
                  </div>
                )}

                {charCount > LINKEDIN_MAX && (
                  <p className="text-xs text-red-600">
                    Post exceeds LinkedIn&apos;s 3,000 character limit. Please edit to shorten it.
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => { setIsEditing(false); setEditedContent(result.content) }}
                        className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { setResult({ ...result, content: editedContent }); setIsEditing(false) }}
                        className="px-4 py-2 text-sm text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Apply Edits
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setIsEditing(true); setEditedContent(result.content) }}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AI Refinement */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Refine with AI</label>
                {refinementHistory.length > 0 && (
                  <button
                    onClick={() => setRefinementHistory([])}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear conversation
                  </button>
                )}
              </div>

              {/* Conversation thread */}
              {refinementHistory.length > 0 && (
                <div className="mb-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {refinementHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {refining && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-400 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5">
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Thinking…
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <textarea
                    value={refinementInput}
                    onChange={(e) => {
                      setRefinementInput(e.target.value)
                      if (refinementError) setRefinementError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleRefine()
                      }
                    }}
                    rows={2}
                    maxLength={320}
                    placeholder={
                      refinementHistory.length > 0
                        ? 'Reply to continue…'
                        : 'e.g. Make it more concise, add a call to action, use a stronger opening hook…'
                    }
                    className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      refinementError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {refinementError ? (
                      <p className="text-xs text-red-600">{refinementError}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Enter to send · Shift+Enter for new line</p>
                    )}
                    <span className={`text-xs ${refinementInput.length > 300 ? 'text-red-500' : 'text-slate-400'}`}>
                      {refinementInput.length}/300
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefine}
                  disabled={refining || !refinementInput.trim() || refinementInput.length > 300}
                  className="px-4 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                >
                  {refining ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>

            {/* Action bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleApprove()}
                  disabled={saving || savedSuccess}
                  className="px-6 py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : savedSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approved
                    </>
                  ) : (
                    'Approve & Save'
                  )}
                </button>

                <button
                  onClick={() => handleSuggest(result.companyPost.id)}
                  className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Suggest another
                </button>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-start gap-4">
                  <button
                    role="switch"
                    aria-checked={autoPost}
                    onClick={() => !savingAutoPost && handleAutoPostToggle(!autoPost)}
                    disabled={savingAutoPost}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
                      autoPost ? 'bg-blue-700' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        autoPost ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto-approve future suggestions</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When enabled, future company posts will be adapted and approved automatically for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
