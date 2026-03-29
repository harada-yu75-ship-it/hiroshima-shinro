import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SAMPLE_MIDDLE_SCHOOLS } from '@/lib/sampleData'
import type { MiddleSchool } from '@/types'

export async function GET() {
  let schools: MiddleSchool[] = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('xxxx')) {
      throw new Error('Supabase not configured')
    }

    const { data, error } = await supabase
      .from('middle_schools')
      .select('*')
      .order('name')
      .limit(300)

    if (error) throw error
    schools = data ?? []
  } catch {
    schools = SAMPLE_MIDDLE_SCHOOLS
  }

  return NextResponse.json({ schools })
}
