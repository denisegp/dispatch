import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

async function extractFromUrl(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Dispatch/1.0)' },
  })
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // Remove non-content elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove()

  // Try to find the main content
  const candidates = ['article', 'main', '[role="main"]', '.content', '.post', '.entry']
  let content = ''
  for (const sel of candidates) {
    const text = $(sel).first().text().trim()
    if (text.length > 200) {
      content = text
      break
    }
  }
  if (!content) content = $('body').text()

  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim()

  const title = $('title').first().text().trim() ||
    $('h1').first().text().trim() ||
    'Untitled'

  return { title, content: content.slice(0, 8000), sourceUrl: url, sourceType: 'url' as const }
}

async function extractFromFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.md') || name.endsWith('.txt')) {
    const content = buffer.toString('utf-8')
    const firstLine = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '') ?? file.name
    return { title: firstLine, content: content.slice(0, 8000), fileName: file.name, sourceType: 'file' as const }
  }

  if (name.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    const content = data.text.replace(/\s+/g, ' ').trim()
    return { title: file.name.replace('.pdf', ''), content: content.slice(0, 8000), fileName: file.name, sourceType: 'file' as const }
  }

  if (name.endsWith('.docx')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    const content = result.value.replace(/\s+/g, ' ').trim()
    return { title: file.name.replace('.docx', ''), content: content.slice(0, 8000), fileName: file.name, sourceType: 'file' as const }
  }

  throw new Error(`Unsupported file type: ${file.name}`)
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
      }
      const result = await extractFromFile(file)
      return NextResponse.json(result)
    }

    const body = await req.json()
    const { url } = body
    if (!url?.trim()) {
      return NextResponse.json({ error: 'url is required.' }, { status: 400 })
    }
    const result = await extractFromUrl(url.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error('extract error:', error)
    const message = error instanceof Error ? error.message : 'Extraction failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
