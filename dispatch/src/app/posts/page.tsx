'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

interface CompanyPost {
  id: string
  title: string
  content: string
  tags: string[]
  priority: number
  sourceUrl: string | null
  sourceType: string
  fileName: string | null
  createdAt: string
}

interface ExtractResult {
  title: string
  content: string
  sourceUrl?: string
  fileName?: string
  sourceType: string
}

type Tab = 'url' | 'file'

export default function PostsPage() {
  const [posts, setPosts] = useState<CompanyPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('url')

  // URL tab state
  const [urlInput, setUrlInput] = useState('')
  const [fetching, setFetching] = useState(false)

  // File tab state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Shared preview state (after extract)
  const [preview, setPreview] = useState<ExtractResult | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')

  // Tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [priority, setPriority] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [extractError, setExtractError] = useState('')

  useEffect(() => {
    fetch('/api/company-posts')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false))
  }, [])

  // All unique tags across existing posts
  const allExistingTags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [posts])

  const existingTagSet = useMemo(() => new Set(allExistingTags), [allExistingTags])

  // Suggestions: existing tags matching current input token, not already selected
  const tagSuggestions = useMemo(() => {
    const token = tagInput.trim()
    if (token.length <= 3) return []
    return allExistingTags.filter(
      (t) =>
        t.toLowerCase().includes(token.toLowerCase()) &&
        !selectedTags.includes(t)
    )
  }, [tagInput, allExistingTags, selectedTags])

  const addTag = (tag: string) => {
    const clean = tag.trim()
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      const clean = tagInput.trim()
      if (clean) {
        addTag(clean)
        setTagInput('')
      }
    } else if (e.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      // Remove last tag on backspace when input is empty
      setSelectedTags((prev) => prev.slice(0, -1))
    }
  }

  const resetTagState = () => {
    setSelectedTags([])
    setTagInput('')
  }

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return
    setFetching(true)
    setExtractError('')
    setPreview(null)
    try {
      const res = await fetch('/api/company-posts/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch URL.')
      setPreview(data)
      setEditedTitle(data.title)
      setEditedContent(data.content)
      resetTagState()
      setPriority(0)
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to fetch URL.')
    } finally {
      setFetching(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true)
    setExtractError('')
    setPreview(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/company-posts/extract', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract file.')
      setPreview(data)
      setEditedTitle(data.title)
      setEditedContent(data.content)
      resetTagState()
      setPriority(0)
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract file.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSave = async () => {
    // Commit any pending text in the input before saving
    const pending = tagInput.trim()
    const finalTags = pending && !selectedTags.includes(pending)
      ? [...selectedTags, pending]
      : selectedTags

    if (!preview || finalTags.length === 0) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/company-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle.trim() || preview.title,
          content: editedContent.trim() || preview.content,
          tags: finalTags,
          priority,
          sourceUrl: preview.sourceUrl ?? null,
          fileName: preview.fileName ?? null,
          sourceType: preview.sourceType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save post.')
      setPosts((prev) => [data.post, ...prev])
      setPreview(null)
      setUrlInput('')
      resetTagState()
      setPriority(0)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save post.')
    } finally {
      setSaving(false)
    }
  }

  const sourceTypeBadge: Record<string, string> = {
    url: 'URL',
    file: 'File',
    manual: 'Manual',
  }

  const hasTags = selectedTags.length > 0 || tagInput.trim().length > 0

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
            <Link href="/posts" className="text-white font-medium border-b border-blue-400 pb-0.5">
              Posts
            </Link>
            <Link href="/suggest" className="text-blue-300 hover:text-white transition-colors">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Company Posts</h1>
          <p className="text-slate-500">
            Add company content that team members can adapt into their own authentic voice.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Add content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Add Content</h2>

              {/* Tabs */}
              <div className="flex border border-slate-200 rounded-lg p-1 mb-5 gap-1">
                <button
                  onClick={() => { setActiveTab('url'); setPreview(null); setExtractError('') }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'url'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  From URL
                </button>
                <button
                  onClick={() => { setActiveTab('file'); setPreview(null); setExtractError('') }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'file'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {activeTab === 'url' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                    placeholder="https://company.com/press-release"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={fetching || !urlInput.trim()}
                    className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {fetching ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Fetching...
                      </>
                    ) : (
                      'Fetch & Preview'
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.md,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="w-full border-2 border-dashed border-slate-300 rounded-lg py-8 px-4 flex flex-col items-center text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadingFile ? (
                      <>
                        <svg className="w-6 h-6 animate-spin text-blue-600 mb-2" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm text-slate-600">Extracting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm font-medium text-slate-700">Click to upload</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, DOCX, MD, TXT</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {extractError && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {extractError}
                </div>
              )}

              {saveSuccess && (
                <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Post added to library.
                </div>
              )}
            </div>
          </div>

          {/* Right: Library — shown only when no preview */}
          <div className={`lg:col-span-3 ${preview ? 'hidden lg:hidden' : ''}`}>
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Library{' '}
              {!loadingPosts && (
                <span className="text-slate-400 font-normal">({posts.length})</span>
              )}
            </h2>

            {loadingPosts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                    <div className="h-3 bg-slate-100 rounded w-16 mb-3" />
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 flex flex-col items-center text-center">
                <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-slate-400 text-sm">No posts yet. Add one from the left panel.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {sourceTypeBadge[post.sourceType] ?? post.sourceType}
                        </span>
                        {post.priority > 0 && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            post.priority >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            P{post.priority}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{post.title}</p>
                    <p className="text-sm text-slate-500 line-clamp-2">{post.content}</p>
                    {post.sourceUrl && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block truncate max-w-xs"
                      >
                        {post.sourceUrl}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full-width preview panel — shown when content was extracted */}
          {preview && (
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Review &amp; Edit Extracted Content</h2>
                <button
                  onClick={() => { setPreview(null); setExtractError(''); resetTagState() }}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕ Discard
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Title + tags + priority */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tags <span className="text-red-500">*</span>
                    </label>

                    {/* Selected tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => removeTag(tag)}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors group ${
                              existingTagSet.has(tag)
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                            }`}
                            title="Click to remove"
                          >
                            {tag}
                            <span className="opacity-50 group-hover:opacity-100 text-[10px] leading-none">✕</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text input */}
                    <input
                      data-testid="tag-input"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={selectedTags.length === 0 ? 'Type a tag, press comma or Enter' : 'Add another tag…'}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Inline suggestions */}
                    {tagSuggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] text-slate-400 mb-1.5">Existing tags — tap to add:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tagSuggestions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onPointerDown={(e) => {
                                // Prevent input blur before this handler fires (works for mouse + touch)
                                e.preventDefault()
                                addTag(tag)
                                setTagInput('')
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-200 mr-1" />existing
                      <span className="inline-block w-2 h-2 rounded-full bg-violet-200 ml-3 mr-1" />new
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Priority
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={1}
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        className="flex-1 accent-blue-700"
                      />
                      <span className={`text-sm font-semibold w-6 text-center ${
                        priority >= 4 ? 'text-red-600' : priority >= 2 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">0 = normal · 5 = always suggest first</p>
                  </div>

                  {preview.sourceUrl && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Source</p>
                      <a
                        href={preview.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {preview.sourceUrl}
                      </a>
                    </div>
                  )}
                  {saveError && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {saveError}
                    </div>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasTags}
                    className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save to Library'
                    )}
                  </button>
                </div>

                {/* Content editor */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Content <span className="text-slate-400 font-normal normal-case">(edit to clean up extracted text)</span>
                  </label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={16}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
                  />
                  <p className="text-xs text-slate-400 mt-1">{editedContent.length.toLocaleString()} characters</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Library shown below preview when active */}
        {preview && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Library{' '}
              <span className="text-slate-400 font-normal">({posts.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {sourceTypeBadge[post.sourceType] ?? post.sourceType}
                      </span>
                      {post.priority > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          post.priority >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          P{post.priority}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{post.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-2">{post.content}</p>
                  {post.sourceUrl && (
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block truncate max-w-xs"
                    >
                      {post.sourceUrl}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
