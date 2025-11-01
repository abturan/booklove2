// src/components/club/ClubHeader.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Props = {
  moderatorName: string
  moderatorAvatarUrl?: string | null
  moderatorUsername?: string | null
  moderatorSlug?: string | null
  clubName: string
  description?: string | null
}

export function ModeratorAboutCard({
  moderatorName,
  moderatorAvatarUrl,
  moderatorUsername,
  moderatorSlug,
  clubName,
  description,
  variant = 'desktop',
}: Props & { variant?: 'desktop' | 'overlay' }) {
  const link = userPath(moderatorUsername, moderatorName, moderatorSlug)
  const isOverlay = variant === 'overlay'

  return (
    <div className={isOverlay ? 'space-y-4 p-6 text-white' : 'space-y-3'}>
      <div className={isOverlay ? 'flex items-start justify-between' : 'flex items-center gap-3'}>
        <Link
          href={link}
          className={isOverlay ? 'inline-block rounded-full ring-4 ring-white/40 shadow-2xl' : 'inline-block'}
        >
          <Avatar
            src={moderatorAvatarUrl}
            size={isOverlay ? 96 : 80}
            alt={moderatorName}
            className={isOverlay ? 'shadow-lg' : 'ring-2 ring-white shadow'}
          />
        </Link>
        {isOverlay && (
          <Link
            href={link}
            className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          >
            Profili Aç
          </Link>
        )}
      </div>
      <div>
        <h2
          className={
            isOverlay
              ? 'text-2xl font-semibold leading-tight text-white'
              : 'text-2xl font-semibold text-slate-900 sm:text-3xl'
          }
        >
          {moderatorName}
        </h2>
        <div className={isOverlay ? 'text-sm text-white/80' : 'text-sm text-slate-500'}>{clubName}</div>
      </div>
      {description && (
        <p className={isOverlay ? 'text-sm leading-relaxed text-white/90' : 'text-gray-700'}>{description}</p>
      )}
      {isOverlay && (
        <div className="rounded-2xl bg-white/15 p-4 text-xs text-white/80">
          <p>
            Moderatör hakkında daha fazla bilgi almak için profilini ziyaret edin. Katılımcılarla bağlantı kurmak
            ve özel notlara erişmek için takip edebilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ClubHeader(props: Props) {
  return (
    <>
      <div className="space-y-4 sm:hidden">
        <div className="text-2xl font-black uppercase tracking-[0.28em] text-slate-900">
          {props.clubName ? props.clubName.toLocaleUpperCase('tr-TR') : ''}
        </div>
        <div className="flex items-center gap-4">
          <Link href={userPath(props.moderatorUsername, props.moderatorName, props.moderatorSlug)} className="shrink-0">
            <Avatar src={props.moderatorAvatarUrl} size={120} alt={props.moderatorName} className="ring-2 ring-white shadow-lg" />
          </Link>
          <div className="min-w-0 space-y-1">
            <div className="text-lg font-semibold text-slate-900">{props.moderatorName}</div>
            {props.moderatorUsername && (
              <div className="text-sm text-slate-500">@{props.moderatorUsername}</div>
            )}
            <Link
              href={userPath(props.moderatorUsername, props.moderatorName, props.moderatorSlug)}
              className="inline-flex items-center rounded-2xl border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Moderatör profilini ziyaret et
            </Link>
          </div>
        </div>
        {props.description && (
          <p className="text-sm leading-relaxed text-slate-600">{props.description}</p>
        )}
      </div>

      <div className="hidden sm:block space-y-6">
        <div className="text-4xl font-extrabold uppercase tracking-[0.3em] text-slate-900">
          {props.clubName ? props.clubName.toLocaleUpperCase('tr-TR') : ''}
        </div>
        <div className="flex items-center gap-6">
          <Link href={userPath(props.moderatorUsername, props.moderatorName, props.moderatorSlug)} className="shrink-0">
            <Avatar
              src={props.moderatorAvatarUrl}
              size={144}
              alt={props.moderatorName}
              className="ring-4 ring-white shadow-xl"
            />
          </Link>
          <div className="min-w-0 space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Moderatör</div>
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-slate-900">{props.moderatorName}</div>
              {props.moderatorUsername && (
                <div className="text-sm text-slate-500">@{props.moderatorUsername}</div>
              )}
            </div>
            <Link
              href={userPath(props.moderatorUsername, props.moderatorName, props.moderatorSlug)}
              className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 transition hover:bg-slate-100"
            >
              Profili ziyaret et
            </Link>
          </div>
        </div>
        {props.description && (
          <p className="text-base leading-relaxed text-slate-600">{props.description}</p>
        )}
      </div>
    </>
  )
}
