import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Amika — Keep the days you almost forgot';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F7EEDF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Pebble Pair */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              transform: 'translateX(16px)',
            }}
          >
            <path
              d="M22 95C7 59 22 17 55 9c30-7 51 16 43 44-5 18-18 27-29 38-8 7-10 15-7 24-18 2-33-5-40-20Z"
              fill="#66705A"
            />
            <circle cx="47" cy="46" r="6" fill="#FFF1DF" />
            <circle cx="66" cy="44" r="6" fill="#FFF1DF" />
            <path d="M51 61q7 7 15-1" stroke="#FFF1DF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <ellipse cx="76" cy="63" rx="4.5" ry="3" fill="#E8B080" opacity=".82" />
          </svg>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              transform: 'translateX(-16px) translateY(18px)',
            }}
          >
            <path
              d="M20 67C20 37 43 15 73 18c28 3 45 27 38 54-7 28-34 42-61 32-19-7-31-20-30-37Z"
              fill="#D48768"
            />
            <circle cx="55" cy="51" r="6" fill="#FFF1DF" />
            <circle cx="75" cy="49" r="6" fill="#FFF1DF" />
            <path d="M59 67q7 7 15-1" stroke="#FFF1DF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <ellipse cx="47" cy="69" rx="4.5" ry="3" fill="#F2DBA6" opacity=".88" />
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#394238',
            marginBottom: 16,
          }}
        >
          Amika
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#675F53',
          }}
        >
          Keep the days you almost forgot
        </div>

        {/* Sparkle accents */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 150,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 120,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: 100,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
