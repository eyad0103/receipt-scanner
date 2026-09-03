'use client'

import { Calendar, Clock, Car, CreditCard, Check } from 'lucide-react'

interface BookingSummaryProps {
  parkingLotName: string
  spotNumber: string
  date: string
  startTime: string
  endTime: string
  duration: number
  pricePerHour: number
  totalPrice: number
  vehiclePlate: string
}

export default function BookingSummary({
  parkingLotName,
  spotNumber,
  date,
  startTime,
  endTime,
  duration,
  pricePerHour,
  totalPrice,
  vehiclePlate,
}: BookingSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Parking Lot</span>
          <span className="font-medium">{parkingLotName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Spot</span>
          <span className="font-medium">{spotNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date</span>
          <span className="font-medium">{date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Time</span>
          <span className="font-medium">
            {startTime} - {endTime}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">
            {duration} {duration === 1 ? 'hour' : 'hours'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Rate</span>
          <span className="font-medium">${pricePerHour}/hour</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Vehicle</span>
          <span className="font-medium">{vehiclePlate}</span>
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
          <span className="text-sm font-medium">
            Free cancellation up to 1 hour before
          </span>
        </div>
      </div>
    </div>
  )
}
