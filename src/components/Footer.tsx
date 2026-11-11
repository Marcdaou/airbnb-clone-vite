export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-12">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row gap-4 justify-between text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Airbnb Clone, Inc. · Privacy · Terms · Sitemap</p>
        <p>English (US) · $ USD · Support</p>
      </div>
    </footer>
  )
}
