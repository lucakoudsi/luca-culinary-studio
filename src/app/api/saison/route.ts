import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/get-request-user'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user) return NextResponse.json([], { status: 401 })

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || 'Sommer'

    console.log('[saison] calling RPC with season:', season)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .rpc('get_seasonal_zutaten', { season_name: season })

    console.log('[saison] RPC result count:', data?.length, 'error:', error)

    if (error) {
      console.error('[saison] RPC error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[saison] crash:', e)
    return NextResponse.json([])
  }
}
