import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-7xl">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
