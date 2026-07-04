export default function QuestionListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="p-4 border border-gray-100 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-12 ml-auto" />
          </div>
        </li>
      ))}
    </ul>
  )
}
