'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
  company: string
  industry: string
  voiceProfile: { id: string } | null
}

interface CascadeResult {
  userId: string
  draftId: string
  content: string
  userName: string
  userRole: string
  userCompany: string
  error?: string
}

export default function CascadePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [adminId, setAdminId] = useState('')

  const [masterContent, setMasterContent] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [cascading, setCascading] = useState(false)
  const [error, setError] = useState('')

  const [results, setResults] = useState<CascadeResult[]>([])
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        const withVoice = (data.users as User[]).filter((u) => u.voiceProfile !== null)
        setUsers(withVoice)

        // Use the stored user as admin, or fall back to first user
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('dispatch_user_id') : null
        if (storedId && withVoice.find((u) => u.id === storedId)) {
          setAdminId(storedId)
        } else if (withVoice.length > 0) {
          setAdminId(withVoice[0].id)
        }
      } catch {
        setError('Failed to load team members. Make sure the database is running.')
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedUserIds(new Set(users.map((u) => u.id)))
  }

  const deselectAll = () => {
    setSelectedUserIds(new Set())
  }

  const handleCascade = async () => {
    if (!masterContent.trim() || selectedUserIds.size === 0) return
    setError('')
    setResults([])
    setApprovedIds(new Set())
    setCascading(true)
    try {
      const res = await fetch('/api/cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterContent: masterContent.trim(),
          userIds: Array.from(selectedUserIds),
          createdById: adminId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cascade failed.')
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setCascading(false)
    }
  }

  const handleApprove = async (result: CascadeResult) => {
    if (!result.draftId || approvingId === result.draftId) return
    setApprovingId(result.draftId)
    try {
      await fetch(`/api/drafts/${result.draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      setApprovedIds((prev) => new Set([...prev, result.draftId]))
    } catch {
      setError(`Failed to approve ${result.userName}'s draft.`)
    } finally {
      setApprovingId(null)
    }
  }

  const masterCharCount = masterContent.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-950 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition-colors">
            Dispatch
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/onboarding" className="text-blue-300 hover:text-white transition-colors">
              Onboarding
            </Link>
            <Link href="/draft" className="text-blue-300 hover:text-white transition-colors">
              Draft
            </Link>
            <Link href="/cascade" className="text-white font-medium border-b border-blue-400 pb-0.5">
              Cascade
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Content Cascade</h1>
          <p className="text-slate-500">
            Take one master message and generate personalized LinkedIn posts for your entire team —
            each in their own authentic voice.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Setup panel */}
        {results.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Master content */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Master Piece</h2>
              <p className="text-xs text-slate-500 mb-4">
                Paste the blog post, announcement, or key message you want to distribute.
              </p>
              <textarea
                value={masterContent}
                onChange={(e) => setMasterContent(e.target.value)}
                rows={12}
                placeholder="Paste your company blog post, press release, key message, or announcement here..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{masterCharCount.toLocaleString()} characters</span>
                {masterContent.trim() && (
                  <span className="text-xs text-green-600 font-medium">Ready to cascade</span>
                )}
              </div>
            </div>

            {/* Team member selection */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Team Members</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select who to cascade to</p>
                </div>
                {users.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <button onClick={selectAll} className="text-blue-600 hover:underline">
                      All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={deselectAll} className="text-slate-500 hover:underline">
                      None
                    </button>
                  </div>
                )}
              </div>

              {loadingUsers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-slate-100 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4 mb-1" />
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-6">
                  <p className="mb-2">No team members with voice profiles.</p>
                  <Link href="/onboarding" className="text-blue-600 hover:underline text-xs font-medium">
                    Complete onboarding →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUserIds.has(user.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'border border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="mt-0.5 accent-blue-700"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.role} · {user.company}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-3">
                  {selectedUserIds.size} of {users.length} selected
                </div>
                <button
                  onClick={handleCascade}
                  disabled={cascading || !masterContent.trim() || selectedUserIds.size === 0 || !adminId}
                  className="w-full py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {cascading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating {selectedUserIds.size} posts...
                    </>
                  ) : (
                    `Cascade to ${selectedUserIds.size || '...'} members`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating skeleton */}
        {cascading && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-700 font-medium">
                Generating personalized posts for {selectedUserIds.size} team member{selectedUserIds.size !== 1 ? 's' : ''}...
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from(selectedUserIds).map((uid) => {
                const user = users.find((u) => u.id === uid)
                return (
                  <div key={uid} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                      <div>
                        <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse mb-1.5" />
                        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                    {user && (
                      <p className="text-xs text-slate-400 mb-3">{user.name} · {user.role}</p>
                    )}
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !cascading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cascade Results
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {results.filter((r) => !r.error).length} posts generated ·{' '}
                  {approvedIds.size} approved
                </p>
              </div>
              <button
                onClick={() => {
                  setResults([])
                  setSelectedUserIds(new Set())
                  setApprovedIds(new Set())
                }}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                New Cascade
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((result) => {
                const isApproved = approvedIds.has(result.draftId)
                const isApproving = approvingId === result.draftId
                const charCount = result.content.length

                return (
                  <div
                    key={result.userId}
                    className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4 transition-colors ${
                      isApproved ? 'border-green-300 bg-green-50/30' : 'border-slate-200'
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {result.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {result.userName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {result.userRole} · {result.userCompany}
                        </p>
                      </div>
                      {isApproved && (
                        <span className="ml-auto flex-shrink-0 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Approved
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {result.error ? (
                      <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                        {result.error}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-3 flex-1 min-h-32 max-h-64 overflow-y-auto text-xs">
                        {result.content}
                      </div>
                    )}

                    {/* Footer */}
                    {!result.error && (
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${
                            charCount > 3000 ? 'text-red-600' : 'text-slate-400'
                          }`}
                        >
                          {charCount.toLocaleString()} chars
                        </span>
                        <button
                          onClick={() => handleApprove(result)}
                          disabled={isApproved || isApproving || !result.draftId}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40'
                          }`}
                        >
                          {isApproving ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Approving...
                            </>
                          ) : isApproved ? (
                            '✓ Approved'
                          ) : (
                            'Approve'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
