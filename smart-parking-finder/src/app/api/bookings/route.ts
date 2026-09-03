import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        parkingLot: true,
        parkingSpot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { parkingLotId, parkingSpotId, startTime, endTime, vehiclePlate } = body

    // Validate the parking spot is available
    const parkingSpot = await prisma.parkingSpot.findUnique({
      where: {
        id: parkingSpotId,
      },
    })

    if (!parkingSpot || parkingSpot.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Parking spot is not available' },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        parkingSpotId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lte: new Date(endTime) },
            endTime: { gte: new Date(startTime) },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Parking spot is already booked for this time' },
        { status: 400 }
      )
    }

    // Calculate duration and price
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationInHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const totalPrice = durationInHours * parkingSpot.pricePerHour

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        startTime: start,
        endTime: end,
        duration: durationInHours,
        totalPrice,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        vehiclePlate,
        userId: session.user.id,
        parkingLotId,
        parkingSpotId,
      },
    })

    // Update parking spot status
    await prisma.parkingSpot.update({
      where: {
        id: parkingSpotId,
      },
      data: {
        status: 'RESERVED',
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
