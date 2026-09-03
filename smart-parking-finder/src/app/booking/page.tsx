'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Clock, Car, CreditCard, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ParkingLot {
  id: string
  name: string
  address: string
  openHour: string
  closeHour: string
  spots: Array<{
    id: string
    spotNumber: string
    type: string
    status: string
    pricePerHour: number
  }>
}

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lotId = searchParams.get('lotId')

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string>('')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    vehiclePlate: '',
  })

  useEffect(() => {
    if (lotId) {
      fetchParkingLot(lotId)
    }
  }, [lotId])

  const fetchParkingLot = async (id: string) => {
    try {
      const response = await fetch(`/api/parking/${id}`)
      const data = await response.json()
      setParkingLot(data)
      
      // Auto-select first available spot
      const availableSpot = data.spots.find(
        (spot: any) => spot.status === 'AVAILABLE'
      )
      if (availableSpot) {
        setSelectedSpot(availableSpot.id)
      }
    } catch (error) {
      console.error('Error fetching parking lot:', error)
      toast.error('Failed to load parking lot details')
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = () => {
    const [startH, startM] = formData.startTime.split(':').map(Number)
    const [endH, endM] = formData.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const durationMinutes = endMinutes - startMinutes
    return Math.max(0, Math.ceil(durationMinutes / 60))
  }

  const calculateTotalPrice = () => {
    const duration = calculateDuration()
    const spot = parkingLot?.spots.find((s) => s.id === selectedSpot)
    return spot ? duration * spot.pricePerHour : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSpot) {
      toast.error('Please select a parking spot')
      return
    }

    if (!formData.vehiclePlate) {
      toast.error('Please enter your vehicle plate number')
      return
    }

    const duration = calculateDuration()
    if (duration <= 0) {
      toast.error('End time must be after start time')
      return
    }

    setSubmitting(true)

    try {
      // Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parkingLotId: lotId,
          parkingSpotId: selectedSpot,
          startTime: `${formData.date}T${formData.startTime}:00`,
          endTime: `${formData.date}T${formData.endTime}:00`,
          vehiclePlate: formData.vehiclePlate,
        }),
      })

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      const booking = await bookingResponse.json()

      // Process payment
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to process payment')
      }

      const payment = await paymentResponse.json()

      // Simulate payment confirmation (in real app, this would be handled by Stripe webhook)
      await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentIntentId: booking.paymentIntentId,
        }),
      })

      toast.success('Booking confirmed!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!parkingLot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Parking lot not found</h2>
        <Link href="/search" className="text-blue-600 hover:underline">
          Back to search
        </Link>
      </div>
    )
  }

  const duration = calculateDuration()
  const totalPrice = calculateTotalPrice()
  const availableSpots = parkingLot.spots.filter(
    (spot) => spot.status === 'AVAILABLE'
  )

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Book Parking Spot</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                {/* Parking Lot Info */}
                <div className="mb-6 pb-6 border-b">
                  <h2 className="text-xl font-semibold mb-2">{parkingLot.name}</h2>
                  <p className="text-gray-600">{parkingLot.address}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Operating hours: {parkingLot.openHour} - {parkingLot.closeHour}
                  </p>
                </div>

                {/* Date and Time */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    Select Date & Time
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Select Spot */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Car size={20} />
                    Select Parking Spot
                  </h3>
                  {availableSpots.length === 0 ? (
                    <p className="text-gray-600">No spots available</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {parkingLot.spots.map((spot) => (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() =>
                            spot.status === 'AVAILABLE' && setSelectedSpot(spot.id)
                          }
                          disabled={spot.status !== 'AVAILABLE'}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            selectedSpot === spot.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : spot.status === 'AVAILABLE'
                              ? 'border-gray-200 hover:border-blue-300'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-sm font-medium">{spot.spotNumber}</div>
                          <div className="text-xs text-gray-500">
                            ${spot.pricePerHour}/hr
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Car size={20} />
                    Vehicle Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Plate Number
                    </label>
                    <input
                      type="text"
                      value={formData.vehiclePlate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehiclePlate: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="ABC 1234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || availableSpots.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Confirm & Pay ${totalPrice.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parking Lot</span>
                    <span className="font-medium">{parkingLot.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spot</span>
                    <span className="font-medium">
                      {selectedSpot
                        ? parkingLot.spots.find((s) => s.id === selectedSpot)
                            ?.spotNumber || '-'
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="font-medium">
                      {formData.startTime} - {formData.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">
                      {duration} {duration === 1 ? 'hour' : 'hours'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle</span>
                    <span className="font-medium">
                      {formData.vehiclePlate || '-'}
                    </span>
                  </div>
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={16} />
                    <span className="text-sm font-medium">Free cancellation up to 1 hour before</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
