import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cat = url.searchParams.get('cat')
  const redirectUrl = new URL('/feed.xml', url.origin)
  if (cat) {
    redirectUrl.searchParams.set('cat', cat)
  }
  return NextResponse.redirect(redirectUrl, 301)
}
