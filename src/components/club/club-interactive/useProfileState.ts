// src/components/club/club-interactive/useProfileState.ts
import { useMemo, useState } from 'react'

type Me = {
  id: string | null
  name: string | null
  email: string | null
  avatarUrl: string | null
  city: string | null
  district: string | null
  phone: string | null
}

export function useProfileState(me: Me) {
  const initialMissing = useMemo(() => !!me.id && (!me.city || !me.district || !me.phone), [me.id, me.city, me.district, me.phone])
  const [profileMissing, setProfileMissing] = useState(initialMissing)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [contractChecked, setContractChecked] = useState(false)
  const [profile, setProfile] = useState({
    city: me.city ?? '',
    district: me.district ?? '',
    phone: me.phone ?? '',
  })

  return {
    profile,
    setProfile,
    profileMissing,
    setProfileMissing,
    showProfileModal,
    setShowProfileModal,
    showContract,
    setShowContract,
    contractChecked,
    setContractChecked,
  }
}
