import { ImageResponse } from 'next/og'
import { createServerClient } from '@/lib/supabase/server'
import type { Person } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: calendar } = await supabase
    .from('calendars').select('*').eq('slug', slug).single()

  if (!calendar) return new Response('Not found', { status: 404 })

  const { data: people } = await supabase
    .from('people').select('*').eq('calendar_id', calendar.id).order('full_name')

  const personList: Person[] = people ?? []

  // Fetch photos as data URIs so they render in the image
  const withPhotos = await Promise.all(
    personList.slice(0, 9).map(async p => {
      if (!p.photo_url) return { ...p, dataUrl: null }
      try {
        const res = await fetch(p.photo_url)
        const buf = await res.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        const mime = res.headers.get('content-type') ?? 'image/jpeg'
        return { ...p, dataUrl: `data:${mime};base64,${b64}` }
      } catch {
        return { ...p, dataUrl: null }
      }
    }),
  )

  const cols = Math.min(withPhotos.length, 3)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e1610 0%, #18130e 60%, #1e1a12 100%)',
          padding: '60px 80px',
          gap: 0,
        }}
      >
        {/* Tree icon */}
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>🌳</div>

        {/* Family name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#f0e8dc',
            textAlign: 'center',
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}
        >
          {calendar.name}
        </div>

        {/* Member count */}
        <div style={{ fontSize: 28, color: '#b09880', marginTop: 12, marginBottom: 48 }}>
          {personList.length} family {personList.length === 1 ? 'member' : 'members'}
        </div>

        {/* Photo grid */}
        {withPhotos.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 20,
              maxWidth: 900,
            }}
          >
            {withPhotos.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {p.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.dataUrl}
                    width={100}
                    height={100}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #352c22' }}
                    alt=""
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: '#241c15',
                      border: '3px solid #352c22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 40,
                    }}
                  >
                    👤
                  </div>
                )}
                <div
                  style={{
                    fontSize: 18,
                    color: '#c4b09a',
                    maxWidth: 120,
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {p.full_name.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branding footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontSize: 22,
            color: '#5a4a38',
            letterSpacing: 1,
          }}
        >
          Family Calendar
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
