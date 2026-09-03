import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import ServicesFromOnboardingCard from '../ServicesFromOnboardingCard';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });


  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  };

  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
});

describe('ServicesFromOnboardingCard Component', () => {
  it('renders experience level and starting price correctly for onboarding services', () => {
    const onboardingServiceEntries = [
      {
        serviceKey: 'ai_automation',
        detail: {
          title: 'AI Automation Developer for Workflows & Chatbots',
          description: 'Automate business workflows using AI tools, agents, and integrations.',
          experience: 'experienced',
          priceRange: '15000',
          pricingUnit: 'project',
        },
      },
      {
        serviceKey: 'mobile_app_development',
        detail: {
          title: 'Full-Stack App Development for Scalable Web Platforms',
          description: 'Build scalable mobile apps with strong UX and reliable backend integrations.',
          experienceYears: '3',
          averageProjectPrice: '25000',
          pricingUnit: 'month',
        },
      },
    ];

    render(
      <ServicesFromOnboardingCard
        onboardingServiceEntries={onboardingServiceEntries}
        getServiceLabel={(key) => key === 'ai_automation' ? 'AI Automation' : 'Mobile App Development'}
      />
    );

    // AI Automation Card Checks
    expect(screen.getByText(/Experienced/i)).toBeTruthy();
    expect(screen.getByText(/₹15,000/)).toBeTruthy();

    // Mobile App Development Card Checks
    expect(screen.getByText(/3\+\s*years/i)).toBeTruthy();
    expect(screen.getByText(/₹25,000\s*\/\s*month/i)).toBeTruthy();
  });

  it('handles experience option keys like entry, intermediate, expert, veteran', () => {
    const onboardingServiceEntries = [
      {
        serviceKey: 'web_dev',
        detail: {
          title: 'Web Developer',
          experience: 'intermediate',
          priceRange: '5000',
        },
      },
    ];

    render(
      <ServicesFromOnboardingCard
        onboardingServiceEntries={onboardingServiceEntries}
      />
    );

    expect(screen.getByText(/Intermediate/i)).toBeTruthy();
    expect(screen.getByText(/₹5,000/)).toBeTruthy();
  });
});
