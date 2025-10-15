// src/app/mesafeli-satis-sozlesmesi/page.tsx
import ModalFrame from '@/components/modals/ModalFrame'
import ContractContent from '@/components/legal/ContractContent'

export default function ContractPageAsModal() {
  return (
    <ModalFrame title="Mesafeli Satış Sözleşmesi" onCloseHref="/">
      <ContractContent />
    </ModalFrame>
  )
}
