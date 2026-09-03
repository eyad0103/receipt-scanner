import { render, screen, waitFor } from '@testing-library/react'
import SearchPage from '@/app/search/page'

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          id: '1',
          name: 'Test Parking Lot',
          address: '123 Test Street',
          latitude: 40.7128,
          longitude: -74.006,
          totalSpots: 100,
          availableSpots: 50,
          averageRating: 4.5,
          openHour: '00:00',
          closeHour: '23:59',
        },
      ]),
  })
) as jest.Mock

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Search Page', () => {
  it('renders the search page', async () => {
    render(<SearchPage />)
    
    const heading = screen.getByText('Available Parking Lots')
    expect(heading).toBeInTheDocument()
  })

  it('displays parking lots', async () => {
    render(<SearchPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Parking Lot')).toBeInTheDocument()
    })
  })

  it('has a search input', () => {
    render(<SearchPage />)
    
    const searchInput = screen.getByPlaceholderText('Search by name or address...')
    expect(searchInput).toBeInTheDocument()
  })

  it('has filter options', () => {
    render(<SearchPage />)
    
    const filtersHeading = screen.getByText('Filters')
    expect(filtersHeading).toBeInTheDocument()
  })
})
