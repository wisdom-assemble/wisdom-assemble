export default function QuestionDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-6 bg-gray-200 rounded w-5/6 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-6" />
      <div className="space-y-2 mb-8">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="p-4 border border-gray-100 rounded-lg space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  )
}
