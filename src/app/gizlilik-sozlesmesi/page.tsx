// src/app/gizlilik-sozlesmesi/page.tsx
import ModalFrame from '@/components/modals/ModalFrame'
import PrivacyContent from '@/components/legal/PrivacyContent'

export default function PrivacyPageAsModal() {
  return (
    <ModalFrame title="Gizlilik Sözleşmesi" onCloseHref="/">
      <PrivacyContent />
    </ModalFrame>
  )
}
