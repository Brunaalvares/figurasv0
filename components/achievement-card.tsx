interface AchievementCardProps {
  name: string
  category?: string
  description?: string
  image?: string
  date: string
}

export function AchievementCard({ name, category, description, image, date }: AchievementCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-xl">
          {image || "🎯"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          {category && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
              {category}
            </span>
          )}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          <p className="text-xs text-gray-500 mt-2">{date}</p>
        </div>
      </div>
    </div>
  )
}
