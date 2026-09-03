'use client'

import { Car } from 'lucide-react'

interface Spot {
  id: string
  spotNumber: string
  type: string
  status: string
  pricePerHour: number
}

interface ParkingSpotSelectorProps {
  spots: Spot[]
  selectedSpotId: string | null
  onSelectSpot: (spotId: string) => void
}

export default function ParkingSpotSelector({
  spots,
  selectedSpotId,
  onSelectSpot,
}: ParkingSpotSelectorProps) {
  const availableSpots = spots.filter((spot) => spot.status === 'AVAILABLE')
  const occupiedSpots = spots.filter((spot) => spot.status === 'OCCUPIED')
  const reservedSpots = spots.filter((spot) => spot.status === 'RESERVED')

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
          <span>Available ({availableSpots.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
          <span>Reserved ({reservedSpots.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
          <span>Occupied ({occupiedSpots.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
        {spots.map((spot) => {
          const isSelected = selectedSpotId === spot.id
          const isAvailable = spot.status === 'AVAILABLE'

          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => isAvailable && onSelectSpot(spot.id)}
              disabled={!isAvailable}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : isAvailable
                    ? 'border-green-200 bg-green-50 hover:border-green-500'
                    : spot.status === 'RESERVED'
                    ? 'border-yellow-200 bg-yellow-50 cursor-not-allowed'
                    : 'border-red-200 bg-red-50 cursor-not-allowed'
                }
              `}
            >
              <Car
                size={20}
                className={`mx-auto mb-1 ${
                  isSelected
                    ? 'text-blue-600'
                    : isAvailable
                    ? 'text-green-600'
                    : spot.status === 'RESERVED'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              />
              <div className="text-sm font-medium">{spot.spotNumber}</div>
              <div className="text-xs text-gray-500">${spot.pricePerHour}/hr</div>
            </button>
          )
        })}
      </div>

      {availableSpots.length === 0 && (
        <p className="text-center text-gray-600 mt-4">
          No spots available at this time
        </p>
      )}
    </div>
  )
}
