// src/app/@modals/(...)hakkimizda/page.tsx
import AboutContent from '@/components/legal/AboutContent'
import ModalFrame from '@/components/modals/ModalFrame'

export default function AboutModal() {
  return (
    <ModalFrame title="Hakkımızda" onCloseHref="/">
      <AboutContent />
    </ModalFrame>
  )
}
