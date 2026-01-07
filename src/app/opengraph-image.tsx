import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Amika - Nurture Your Friendships';
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
          background: 'linear-gradient(135deg, #B5D1B5 0%, #8FB88F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Hearts icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          {/* Left heart */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              transform: 'rotate(-12deg) translateX(20px)',
              opacity: 0.95,
            }}
          >
            <path
              d="M60 100 C20 60, 20 20, 60 40 C100 20, 100 60, 60 100"
              fill="#FFFBF5"
            />
          </svg>
          {/* Right heart */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              transform: 'rotate(12deg) translateX(-20px)',
              opacity: 0.9,
            }}
          >
            <path
              d="M60 100 C20 60, 20 20, 60 40 C100 20, 100 60, 60 100"
              fill="#D4A5A5"
            />
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#FFFBF5',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            marginBottom: 16,
          }}
        >
          Amika
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#FFFBF5',
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          Nurture Your Friendships
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
