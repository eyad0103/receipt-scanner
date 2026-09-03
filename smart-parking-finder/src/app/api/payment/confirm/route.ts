import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, paymentIntentId } = body

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, you would verify the payment with Stripe here
    // For demo, we'll simulate successful payment

    // Update booking status
    await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentIntentId,
      },
    })

    // Update parking spot status to OCCUPIED
    await prisma.parkingSpot.update({
      where: {
        id: booking.parkingSpotId,
      },
      data: {
        status: 'OCCUPIED',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
