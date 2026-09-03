# Smart Parking Finder

An AI-powered smart parking finder application built with Next.js, Prisma, and Tailwind CSS.

## Features

- **Real-time Availability**: See live updates on parking spot availability
- **Instant Booking**: Reserve your spot in seconds with our quick booking system
- **Secure Payments**: Pay securely online with multiple payment options
- **AI Recommendations**: Get personalized parking recommendations based on your preferences
- **Interactive Maps**: Visualize parking locations on an interactive map
- **Reviews & Ratings**: Read and leave reviews for parking lots

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily swappable to PostgreSQL)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Maps**: Leaflet / React-Leaflet

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-parking-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Initialize the database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
smart-parking-finder/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── booking/           # Booking page
│   │   ├── dashboard/         # Dashboard page
│   │   ├── search/            # Search page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── parking/           # Parking components
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── auth.ts            # Authentication config
│   │   └── prisma.ts          # Prisma client
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind config
└── tsconfig.json              # TypeScript config
```

## API Endpoints

- `GET /api/parking` - Get all parking lots
- `POST /api/parking` - Create a new parking lot
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create a new booking
- `POST /api/payment` - Process payment
- `POST /api/payment/confirm` - Confirm payment

## Testing

Run the test suite:
```bash
npm test
```

## License

MIT
