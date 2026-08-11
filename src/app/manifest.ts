import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amika - Daily memories with friends',
    short_name: 'Amika',
    description: 'A memory-first social app for saving and sharing everyday moments with friends.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7EEDF',
    theme_color: '#F7EEDF',
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
