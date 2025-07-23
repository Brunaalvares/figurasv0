"use client"

interface StickerCardProps {
  points: number
  emoji: string
  earned?: boolean
  onClick?: () => void
}

const stickerEmojis: Record<number, string> = {
  5: "⭐",
  10: "🏆",
  15: "🎖️",
  20: "💎",
  25: "👑",
  30: "🔥",
}

export function StickerCard({ points, emoji, earned = false, onClick }: StickerCardProps) {
  return (
    <div
      className={`
        relative aspect-square rounded-lg border-2 transition-all duration-300 cursor-pointer
        ${
          earned
            ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 shadow-lg transform hover:scale-105"
            : "bg-gray-100 border-gray-300 hover:border-gray-400"
        }
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <div className={`text-4xl mb-1 ${earned ? "animate-pulse" : "opacity-30"}`}>
          {earned ? emoji : stickerEmojis[points]}
        </div>
        <div className={`text-sm font-bold ${earned ? "text-orange-600" : "text-gray-400"}`}>{points}pts</div>
      </div>

      {earned && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  )
}
