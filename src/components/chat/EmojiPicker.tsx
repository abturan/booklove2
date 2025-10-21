// src/components/chat/EmojiPicker.tsx
'use client'

const EMOJIS = [
  '🙂','😀','😁','😂','😅','😉','😊','😍',
  '🤩','😜','😎','😇','🤗','🥳','🙌','🙏',
  '👏','👍','👌','🔥','✨','🎉','❤️','💛',
  '💚','💙','💜','🖤','🤍','📚','✍️','📖'
]

export default function EmojiPicker({ onSelect }: { onSelect: (e: string) => void }) {
  return (
    <div className="w-56 rounded-2xl border bg-white p-2 ring-1 ring-black/5">
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-gray-100 text-xl"
            onClick={() => onSelect(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
