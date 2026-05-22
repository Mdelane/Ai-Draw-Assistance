export default function StarDisplay({ rating, count }: { rating: number; count?: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-yellow-400">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        <span className="text-gray-300">{'★'.repeat(empty)}</span>
      </span>
      <span className="text-sm text-gray-500">{rating.toFixed(1)}{count != null ? ` (${count})` : ''}</span>
    </span>
  )
}
