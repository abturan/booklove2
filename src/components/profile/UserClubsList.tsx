// import Link from 'next/link'
// import Image from 'next/image'

// type ClubLite = {
//   slug: string
//   name: string
//   bannerUrl: string | null
//   _count?: { memberships?: number; picks?: number; events?: number }
// }

// function Stat({
//   icon,
//   value,
//   label,
// }: { icon: string; value: number; label: string }) {
//   return (
//     <span
//       className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-gray-700"
//       aria-label={`${label}: ${value}`}
//       title={`${label}: ${value}`}
//     >
//       <span aria-hidden>{icon}</span>
//       <span className="tabular-nums">{value}</span>
//     </span>
//   )
// }

// export default function UserClubsList({ clubs }: { clubs: ClubLite[] }) {
//   if (!clubs || clubs.length === 0) {
//     return (
//       <div className="card p-5 text-sm text-gray-600">
//         Henüz bir kulübe üye değil.
//       </div>
//     )
//   }

//   return (
//     <section className="card divide-y">
//       {clubs.map((c) => (
//         <div key={c.slug} className="flex items-center gap-3 p-4">
//           <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-black/5 bg-gray-100">
//             <Image
//               src={
//                 c.bannerUrl ??
//                 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=300&auto=format&fit=crop'
//               }
//               alt=""
//               fill
//               className="object-cover"
//             />
//           </div>

//           <div className="min-w-0 flex-1">
//             <Link
//               href={`/clubs/${c.slug}`}
//               className="font-medium text-gray-900 hover:underline truncate"
//             >
//               {c.name}
//             </Link>
//           </div>

//           <div className="flex items-center gap-2">
//             <Stat icon="👥" value={c._count?.memberships ?? 0} label="Abone" />
//             <Stat icon="📚" value={c._count?.picks ?? 0} label="Seçki" />
//             <Stat icon="🗓️" value={c._count?.events ?? 0} label="Oturum" />
//           </div>
//         </div>
//       ))}
//     </section>
//   )
// }
