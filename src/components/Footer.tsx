export default function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="container mx-auto px-4 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Boook.Love</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Hakkında</a>
          <a href="#" className="hover:underline">Gizlilik</a>
          <a href="#" className="hover:underline">İletişim</a>
        </div>
      </div>
    </footer>
  )
}
