import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';
import { supabase } from '@/lib/supabase/clients';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));

// Mock supabase client
jest.mock('@/lib/supabase/clients', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

// Test component to expose auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="initialized">{auth.isInitialized.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="hasUser">{(auth.user !== null).toString()}</div>
      <div data-testid="hasProfile">{(auth.profile !== null).toString()}</div>
    </div>
  );
}

describe('Authentication Flow', () => {
  const mockRouter = {
    replace: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initial state is loading and not initialized', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('initialized').textContent).toBe('false');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  test('handles successful authentication', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'mock-token'
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      credits: 100
    };

    // Mock successful auth responses
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const mockSingleResponse = {
      data: mockProfile,
      error: null
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockSingleResponse)
      })
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('hasUser').textContent).toBe('true');
      expect(screen.getByTestId('hasProfile').textContent).toBe('true');
    });
  });

  test('handles failed authentication', async () => {
    // Mock failed auth response
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('hasUser').textContent).toBe('false');
      expect(screen.getByTestId('hasProfile').textContent).toBe('false');
    });
  });

  test('dashboard layout redirects when not authenticated', async () => {
    // Mock unauthenticated state
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    });

    await act(async () => {
      render(
        <AuthProvider>
          <DashboardLayout>
            <div>Dashboard Content</div>
          </DashboardLayout>
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  test('dashboard layout shows content when authenticated', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'mock-token'
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      credits: 100
    };

    // Mock successful auth responses
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const mockSingleResponse = {
      data: mockProfile,
      error: null
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockSingleResponse)
      })
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect
    });

    await act(async () => {
      render(
        <AuthProvider>
          <DashboardLayout>
            <div data-testid="dashboard-content">Dashboard Content</div>
          </DashboardLayout>
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles session expiry', async () => {
    // First mock a valid session
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'mock-token'
    };

    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      credits: 100
    };

    const mockSingleResponse = {
      data: mockProfile,
      error: null
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue(mockSingleResponse)
      })
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect
    });

    (supabase.auth.getSession as jest.Mock)
      .mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      })
      // Then mock session expiry
      .mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for initial auth
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Simulate visibility change
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should redirect to login
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });
});
