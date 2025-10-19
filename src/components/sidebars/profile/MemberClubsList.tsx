// //src/components/sidebars/profile/MemberClubList.tsx
// import Link from 'next/link'

// type Item = {
//   slug: string
//   name: string
//   bannerUrl: string | null
//   counts: { memberships: number; picks: number; events: number }
// }

// export default function MemberClubList({ items }: { items: Item[] }) {
//   if (!items?.length) return null

//   return (
//     <section className="card p-4 space-y-3">
//       <h3 className="text-sm font-semibold text-gray-700">Üye Olduğu Kulüpler</h3>
//       <ul className="space-y-2">
//         {items.map((c) => (
//           <li key={c.slug} className="group">
//             <Link
//               href={`/clubs/${c.slug}`}
//               className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-gray-50 transition"
//             >
//               <div className="min-w-0">
//                 <div className="truncate font-medium">{c.name}</div>
//                 <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
//                   <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
//                     👥 <b className="font-semibold">{c.counts.memberships}</b> Üye
//                   </span>
//                   <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
//                     📚 <b className="font-semibold">{c.counts.picks}</b> Seçki
//                   </span>
//                   <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
//                     🗓️ <b className="font-semibold">{c.counts.events}</b> Oturum
//                   </span>
//                 </div>
//               </div>
//               <span className="text-xs text-gray-400 group-hover:text-gray-600">→</span>
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </section>
//   )
// }
