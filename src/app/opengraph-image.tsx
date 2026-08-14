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
        {/* Memory Seedling */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <svg width="170" height="170" viewBox="0 0 120 120">
            <path d="M62 36c4-17 20-26 36-20-1 18-14 31-33 28Z" fill="#59674D" />
            <path d="M60 39c-2 8-2 15 0 22" stroke="#394238" strokeWidth="4" strokeLinecap="round" />
            <path d="M20 76c0-23 18-35 40-35 24 0 41 12 41 36 0 23-18 35-41 35S20 99 20 76Z" fill="#D48768" />
            <circle cx="48" cy="78" r="3.3" fill="#394238" />
            <circle cx="72" cy="78" r="3.3" fill="#394238" />
            <path d="M52 88q8 7 16 0" stroke="#394238" strokeWidth="3.2" strokeLinecap="round" fill="none" />
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
