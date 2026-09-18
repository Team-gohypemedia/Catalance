import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FreelancerProfileDialog from './FreelancerProfileDialog';

vi.mock('@/shared/context/AuthContext', () => ({ useAuth: () => ({}) }));

afterEach(cleanup);

function renderProjects(portfolioProjects) {
  return render(
    <FreelancerProfileDialog
      open
      onOpenChange={() => {}}
      viewingFreelancer={{ name: 'Test Freelancer', portfolioProjects }}
    />,
  );
}

describe('freelancer portfolio projects', () => {
  it('shows a text card without an invented image when no photo was uploaded', () => {
    renderProjects([{ title: 'Clothing website', description: 'A custom storefront.' }]);
    expect(screen.getByRole('heading', { name: 'Clothing website' })).toBeTruthy();
    expect(screen.getByText('A custom storefront.')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('1 project')).toBeTruthy();
  });

  it('keeps uploaded images and project links, but removes failed images', () => {
    renderProjects([{ title: 'Vehicle service app', image: '/uploads/service-app.png', link: 'https://example.com', description: 'Booking and maintenance.' }]);
    const image = screen.getByRole('img', { name: 'Vehicle service app' });
    expect(image.getAttribute('src')).toBe('/uploads/service-app.png');
    expect(screen.getByRole('link', { name: /Vehicle service app/ }).getAttribute('href')).toBe('https://example.com');
    fireEvent.error(image);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Booking and maintenance.')).toBeTruthy();
  });
});
