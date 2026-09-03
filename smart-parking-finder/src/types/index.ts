export interface ParkingLot {
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
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface ParkingSpot {
  id: string
  spotNumber: string
  type: string
  status: string
  pricePerHour: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  parkingLotId: string
}

export interface Booking {
  id: string
  startTime: Date
  endTime: Date
  duration: number
  totalPrice: number
  status: string
  paymentStatus: string
  paymentIntentId?: string
  vehiclePlate: string
  createdAt: Date
  updatedAt: Date
  userId: string
  parkingLotId: string
  parkingSpotId: string
}

export interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  parkingLotId: string
}

export interface SearchResult {
  parkingLot: ParkingLot
  availableSpots: number
  distance?: number
}

export interface BookingRequest {
  parkingLotId: string
  parkingSpotId: string
  startTime: string
  endTime: string
  vehiclePlate: string
}

export interface PaymentIntent {
  clientSecret: string
  amount: number
}
