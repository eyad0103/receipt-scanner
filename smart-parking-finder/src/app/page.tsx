import Link from 'next/link'
import { MapPin, Search, Clock, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Smart Parking Finder
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Find and book parking spots instantly with AI-powered recommendations
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              href="/search" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              <Search className="mr-2" size={20} />
              Find Parking
            </Link>
            <Link 
              href="/dashboard" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              Manage Parking Lots
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Smart Parking?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Availability</h3>
              <p className="text-gray-600">
                See live updates on parking spot availability across the city
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">
                Reserve your spot in seconds with our quick booking system
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Pay securely online with multiple payment options
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Search Location</h3>
              <p className="text-gray-600 text-sm">Enter your destination or allow location access</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Choose Spot</h3>
              <p className="text-gray-600 text-sm">Select from available spots with pricing info</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Book & Pay</h3>
              <p className="text-gray-600 text-sm">Reserve and pay securely in one click</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Park & Go</h3>
              <p className="text-gray-600 text-sm">Drive to your reserved spot and park</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Smart Parking Finder</h3>
              <p className="text-gray-400">
                Making parking easy, fast, and stress-free.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/search" className="hover:text-white">Find Parking</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@smartparking.com</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Smart Parking Finder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
