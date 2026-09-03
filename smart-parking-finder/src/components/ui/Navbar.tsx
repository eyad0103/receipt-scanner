'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Car } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Search', href: '/search' },
    { name: 'Dashboard', href: '/dashboard' },
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Car className="text-blue-600" size={24} />
            <span className="text-xl font-bold text-blue-600">Smart Parking</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600'
                } transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 ${
                  pathname === item.href
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600'
                } transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
