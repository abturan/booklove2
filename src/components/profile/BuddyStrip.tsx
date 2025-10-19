// // src/components/profile/BuddyStrip.tsx
// import Link from 'next/link'
// import Avatar from '@/components/Avatar'

// type Friend = { id: string; name: string | null; username: string | null; avatarUrl: string | null }

// export default function BuddyStrip({ friends }: { friends: Friend[] }) {
//   const visible = friends.slice(0, 15)
//   const remaining = Math.max(friends.length - visible.length, 0)

//   return (
//     <div className="mt-3">
//       <div className="grid grid-cols-5 gap-3">
//         {visible.map((f) => {
//           const href = f.username ? `/u/${f.username}` : '#'
//           return (
//             <Link
//               key={f.id}
//               href={href}
//               className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-gray-50"
//             >
//               <Avatar src={f.avatarUrl} alt={f.name || f.username || 'Buddy'} size={56} />
//               <div className="w-full text-center text-xs leading-4 line-clamp-2">
//                 {f.name || f.username || 'Buddy'}
//               </div>
//             </Link>
//           )
//         })}
//         {remaining > 0 && (
//           <Link
//             href="/friends"
//             className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-gray-50"
//           >
//             <div className="h-14 w-14 grid place-content-center rounded-full ring-1 ring-black/10">
//               +{remaining}
//             </div>
//             <div className="text-xs text-center">Tümü</div>
//           </Link>
//         )}
//       </div>
//     </div>
//   )
// }
