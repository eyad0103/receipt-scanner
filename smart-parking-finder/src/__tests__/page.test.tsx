import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Home Page', () => {
  it('renders the hero section', () => {
    render(<Home />)
    
    const heading = screen.getByText('Smart Parking Finder')
    expect(heading).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(<Home />)
    
    const searchButton = screen.getByText('Find Parking')
    expect(searchButton).toBeInTheDocument()
    expect(searchButton).toHaveAttribute('href', '/search')
  })

  it('renders the features section', () => {
    render(<Home />)
    
    const featureHeading = screen.getByText('Why Choose Smart Parking?')
    expect(featureHeading).toBeInTheDocument()
  })

  it('renders the how it works section', () => {
    render(<Home />)
    
    const howItWorksHeading = screen.getByText('How It Works')
    expect(howItWorksHeading).toBeInTheDocument()
  })

  it('renders the footer', () => {
    render(<Home />)
    
    const copyright = screen.getByText(/© 2026 Smart Parking Finder/)
    expect(copyright).toBeInTheDocument()
  })
})
