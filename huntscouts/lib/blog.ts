import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog')

export type PostMeta = {
  slug: string
  title: string
  description: string
  date: string
  author: string
  category: string
  readingTime: string
  coverImage?: string
}

export type Post = PostMeta & { content: string }

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))

  return files
    .map(filename => {
      const slug = filename.replace(/\.mdx?$/, '')
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ?? '',
        author: data.author ?? 'HuntScouts Team',
        category: data.category ?? 'Strategy',
        readingTime: readingTime(content).text,
        coverImage: data.coverImage,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPost(slug: string): Post | null {
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`)
  const mdPath = path.join(POSTS_DIR, `${slug}.md`)
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null
  if (!filePath) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    author: data.author ?? 'HuntScouts Team',
    category: data.category ?? 'Strategy',
    readingTime: readingTime(content).text,
    coverImage: data.coverImage,
    content,
  }
}
