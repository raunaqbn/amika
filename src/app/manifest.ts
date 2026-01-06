import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amika - Nurture Your Friendships',
    short_name: 'Amika',
    description: 'A beautiful app to help you stay connected with the people who matter most',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBF5',
    theme_color: '#A8C5A8',
    orientation: 'portrait-primary',
    categories: ['lifestyle', 'social'],
    icons: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
