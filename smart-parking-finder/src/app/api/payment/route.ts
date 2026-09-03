import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Initialize Stripe (you'll need to set STRIPE_SECRET_KEY in .env)
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId } = body

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        parkingLot: true,
        parkingSpot: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 })
    }

    // Create Stripe Payment Intent (simulated for demo)
    // In production, you would use actual Stripe API
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      clientSecret: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(booking.totalPrice * 100), // Stripe uses cents
    }

    // Update booking with payment intent
    await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        paymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.clientSecret,
      amount: booking.totalPrice,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
