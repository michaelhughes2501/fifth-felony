import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { communityReplySchema, parseJson, uuidSchema } from '@/lib/request-validation'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data, error } = await supabase
    .from('community_replies')
    .select('*, author:profiles(id, full_name)')
    .eq('post_id', id)
    .order('created_at')
  if (error) return NextResponse.json({ error: 'Could not load replies' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = await parseJson(req, communityReplySchema)
  if (!input) return NextResponse.json({ error: 'Invalid reply' }, { status: 400 })
  const { data, error } = await supabase
    .from('community_replies')
    .insert({ post_id: id, author_id: user.id, body: input.body })
    .select()
    .single()
  if (error) return NextResponse.json({ error: 'Could not create reply' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
