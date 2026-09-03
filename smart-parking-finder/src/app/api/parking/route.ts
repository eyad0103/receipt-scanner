import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = searchParams.get('radius') || '5' // default 5km

    let parkingLots

    if (latitude && longitude) {
      // Find parking lots near the specified location
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      const radiusInKm = parseFloat(radius)

      // Simple distance calculation (in a real app, you'd use PostGIS or similar)
      parkingLots = await prisma.parkingLot.findMany({
        where: {
          isActive: true,
          latitude: {
            gte: lat - (radiusInKm / 111),
            lte: lat + (radiusInKm / 111),
          },
          longitude: {
            gte: lng - (radiusInKm / (111 * Math.cos((lat * Math.PI) / 180))),
            lte: lng + (radiusInKm / (111 * Math.cos((lat * Math.PI) / 180))),
          },
        },
        include: {
          spots: {
            where: {
              isActive: true,
              status: 'AVAILABLE',
            },
          },
          reviews: true,
        },
      })
    } else {
      // Return all active parking lots
      parkingLots = await prisma.parkingLot.findMany({
        where: {
          isActive: true,
        },
        include: {
          spots: {
            where: {
              isActive: true,
              status: 'AVAILABLE',
            },
          },
          reviews: true,
        },
      })
    }

    // Calculate average rating and available spots for each parking lot
    const results = parkingLots.map((lot) => {
      const avgRating =
        lot.reviews.length > 0
          ? lot.reviews.reduce((sum, review) => sum + review.rating, 0) /
            lot.reviews.length
          : 0

      return {
        ...lot,
        averageRating: Math.round(avgRating * 10) / 10,
        availableSpots: lot.spots.length,
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching parking lots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parking lots' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, latitude, longitude, description, imageUrl, totalSpots, openHour, closeHour, userId } = body

    const parkingLot = await prisma.parkingLot.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        description,
        imageUrl,
        totalSpots,
        openHour: openHour || '00:00',
        closeHour: closeHour || '23:59',
        userId,
      },
    })

    // Create parking spots for the lot
    const spots = []
    for (let i = 1; i <= totalSpots; i++) {
      spots.push({
        spotNumber: `A${i.toString().padStart(3, '0')}`,
        type: 'STANDARD',
        status: 'AVAILABLE',
        pricePerHour: 5.0, // Default price
        parkingLotId: parkingLot.id,
      })
    }

    await prisma.parkingSpot.createMany({
      data: spots,
    })

    return NextResponse.json(parkingLot, { status: 201 })
  } catch (error) {
    console.error('Error creating parking lot:', error)
    return NextResponse.json(
      { error: 'Failed to create parking lot' },
      { status: 500 }
    )
  }
}
