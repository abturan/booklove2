// src/app/@modals/(...)mesafeli-satis-sozlesmesi/page.tsx
import ContractContent from '@/components/legal/ContractContent'
import ModalFrame from '@/components/modals/ModalFrame'

export default function ContractModalRoute() {
  return (
    <ModalFrame title="Mesafeli Satış Sözleşmesi" onCloseHref="/">
      <ContractContent />
    </ModalFrame>
  )
}
