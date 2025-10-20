// src/components/feed/post/PostActions.tsx
export default function PostActions({ likeCount, onToggleLike, onToggleComments, canInteract }: { likeCount: number; onToggleLike: () => void; onToggleComments: () => void; canInteract: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
      <button type="button" onClick={canInteract ? onToggleLike : undefined} disabled={!canInteract} className="hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed">
        ❤️ {likeCount}
      </button>
      <button type="button" onClick={onToggleComments} className="hover:text-rose-600">
        💬
      </button>
    </div>
  )
}
