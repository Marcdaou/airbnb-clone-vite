import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import ListingPage from './pages/ListingPage'
import Trips from './pages/Trips'
import Wishlists from './pages/Wishlists'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'
import NotFound from './pages/NotFound'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms/:id" element={<ListingPage />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/wishlists" element={<Wishlists />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
    </div>
  )
}
