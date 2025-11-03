import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TahsinKu Dashboard - Platform Manajemen Tahsin',
    short_name: 'TahsinKu',
    description: 'Platform manajemen untuk kelas tahsin',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b2b',
    theme_color: '#6d28d9',
    icons: [
      { src: '/sosro.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/sosro.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ],
  }
}
