'use client'

function getEmbedInfo(url: string): { type: 'youtube' | 'vimeo' | 'html5'; embedUrl: string } {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : new URLSearchParams(url.split('?')[1] ?? '').get('v')
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${id ?? ''}` }
  }
  if (url.includes('vimeo.com')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0]
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id ?? ''}` }
  }
  return { type: 'html5', embedUrl: url }
}

export default function VideoEmbed({ url, poster }: { url: string; poster?: string }) {
  const { type, embedUrl } = getEmbedInfo(url)

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-600 mb-2">Meet your outfitter — watch before you book</p>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
        {type === 'html5' ? (
          <video src={embedUrl} poster={poster} controls className="w-full h-full" />
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}
