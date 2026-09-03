'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Filter, Star, Clock, Car } from 'lucide-react'
import Link from 'next/link'

interface ParkingLot {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  description?: string
  imageUrl?: string
  totalSpots: number
  openHour: string
  closeHour: string
  availableSpots: number
  averageRating: number
}

export default function SearchPage() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 20,
    minRating: 0,
    openNow: false,
  })

  useEffect(() => {
    fetchParkingLots()
  }, [])

  const fetchParkingLots = async () => {
    try {
      const response = await fetch('/api/parking')
      const data = await response.json()
      setParkingLots(data)
    } catch (error) {
      console.error('Error fetching parking lots:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLots = parkingLots.filter((lot) => {
    const matchesSearch =
      lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters =
      lot.averageRating >= filters.minRating &&
      (!filters.openNow || isLotOpen(lot.openHour, lot.closeHour))

    return matchesSearch && matchesFilters
  })

  const isLotOpen = (openHour: string, closeHour: string) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute

    const [openH, openM] = openHour.split(':').map(Number)
    const [closeH, closeM] = closeHour.split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM

    if (openTime <= closeTime) {
      return currentTime >= openTime && currentTime <= closeTime
    } else {
      // Overnight schedule
      return currentTime >= openTime || currentTime <= closeTime
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Smart Parking
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-gray-600 hover:text-blue-600">
                Search
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, minRating: rating })}
                      className={`p-1 rounded ${
                        filters.minRating === rating
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-500'
                      }`}
                    >
                      <Star size={20} fill={filters.minRating >= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                  </span>
                </div>
              </div>

              {/* Open Now Filter */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Open Now</span>
                </label>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilters({ minPrice: 0, maxPrice: 20, minRating: 0, openNow: false })
                }}
                className="w-full text-blue-600 text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Available Parking Lots</h1>
              <span className="text-gray-600">
                {filteredLots.length} {filteredLots.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No parking lots found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredLots.map((lot) => (
                  <div
                    key={lot.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {lot.imageUrl && (
                      <img
                        src={lot.imageUrl}
                        alt={lot.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold">{lot.name}</h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm font-medium">{lot.averageRating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin size={16} />
                        <span className="text-sm">{lot.address}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Car size={16} />
                          <span>
                            {lot.availableSpots}/{lot.totalSpots} spots
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            {lot.openHour} - {lot.closeHour}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/booking?lotId=${lot.id}`}
                        className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
                          lot.availableSpots > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {lot.availableSpots > 0 ? 'Book Now' : 'Full'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
