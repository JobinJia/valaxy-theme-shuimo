export function slugToFileName(slug: string): string {
  return slug.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'
}
