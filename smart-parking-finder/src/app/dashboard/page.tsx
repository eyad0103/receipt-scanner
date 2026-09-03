'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Car, MapPin, Plus, Trash2, Edit, Star } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  startTime: string
  endTime: string
  duration: number
  totalPrice: number
  status: string
  paymentStatus: string
  vehiclePlate: string
  parkingLot: {
    id: string
    name: string
    address: string
  }
  parkingSpot: {
    spotNumber: string
  }
}

interface ParkingLot {
  id: string
  name: string
  address: string
  totalSpots: number
  availableSpots: number
  averageRating: number
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bookings' | 'parking-lots'>('bookings')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bookingsRes, lotsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/parking'),
      ])

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }

      if (lotsRes.ok) {
        const lotsData = await lotsRes.json()
        setParkingLots(lotsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Booking cancelled')
        fetchData()
      } else {
        throw new Error('Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.startTime) > new Date()
  )

  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || new Date(b.endTime) < new Date()
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
              <Link href="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Book Parking
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('parking-lots')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'parking-lots'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Parking Lots ({parkingLots.length})
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No upcoming bookings
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Book a parking spot to get started
                  </p>
                  <Link
                    href="/search"
                    className="text-blue-600 hover:underline"
                  >
                    Find Parking
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.parkingLot.name}
                          </h3>
                          <p className="text-gray-600 text-sm flex items-center gap-1">
                            <MapPin size={14} />
                            {booking.parkingLot.address}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>
                            {new Date(booking.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span>
                            {new Date(booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(booking.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-gray-400" />
                          <span>{booking.parkingSpot.spotNumber}</span>
                        </div>
                        <div className="font-semibold">
                          ${booking.totalPrice.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="w-full text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Cancel Booking
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Bookings */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Past Bookings</h2>
              {pastBookings.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-gray-600">No past bookings</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pastBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">
                              {booking.parkingLot.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Spot {booking.parkingSpot.spotNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(booking.startTime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${booking.totalPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Parking Lots Tab */}
        {activeTab === 'parking-lots' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingLots.map((lot) => (
              <div
                key={lot.id}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{lot.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm">{lot.averageRating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex items-center gap-1">
                  <MapPin size={14} />
                  {lot.address}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {lot.availableSpots}/{lot.totalSpots} spots available
                  </span>
                  <Link
                    href={`/dashboard/parking-lot/${lot.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit size={14} />
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
