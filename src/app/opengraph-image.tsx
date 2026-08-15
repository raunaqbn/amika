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
            <path d="M62 39C66 20 81 10 100 14C99 33 85 45 66 44Z" fill="#59674D" />
            <path d="M62 39C59 46 59 51 61 57" stroke="#394238" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M20 75C20 55 34 44 58 43C82 42 100 55 100 76C100 96 83 108 60 108C36 108 20 97 20 75Z" fill="#D48768" />
            <path d="M39 74Q45 68 51 74" stroke="#394238" strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M68 74Q74 68 80 74" stroke="#394238" strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M51 87Q60 93 69 87" stroke="#394238" strokeWidth="3.4" strokeLinecap="round" fill="none" />
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
