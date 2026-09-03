'use client'

import { MapPin, Clock, Star, Car } from 'lucide-react'
import Link from 'next/link'

interface ParkingLotCardProps {
  id: string
  name: string
  address: string
  availableSpots: number
  totalSpots: number
  averageRating: number
  openHour: string
  closeHour: string
  imageUrl?: string
}

export default function ParkingLotCard({
  id,
  name,
  address,
  availableSpots,
  totalSpots,
  averageRating,
  openHour,
  closeHour,
  imageUrl,
}: ParkingLotCardProps) {
  const isOpen = () => {
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
      return currentTime >= openTime || currentTime <= closeTime
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <img src={imageUrl} alt={name} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold">{name}</h3>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-medium">{averageRating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin size={16} />
          <span className="text-sm">{address}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Car size={16} />
            <span>
              {availableSpots}/{totalSpots} spots
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>
              {openHour} - {closeHour}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOpen() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isOpen() ? 'Open Now' : 'Closed'}
          </span>
          {availableSpots > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {availableSpots} spots available
            </span>
          )}
        </div>

        <Link
          href={`/booking?lotId=${id}`}
          className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
            availableSpots > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {availableSpots > 0 ? 'Book Now' : 'Full'}
        </Link>
      </div>
    </div>
  )
}
