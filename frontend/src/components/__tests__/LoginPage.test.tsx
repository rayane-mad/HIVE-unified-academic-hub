import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';

// Mock fetch globally
(globalThis as any).fetch = vi.fn();

describe('LoginPage Component', () => {
    const mockOnLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        ((globalThis as any).fetch as any).mockClear();
    });

    describe('Rendering', () => {
        it('should render login form by default', () => {
            render(<LoginPage onLogin={mockOnLogin} />);

            expect(screen.getByText(/Welcome to Hive/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
        });

        it('should render forgot password link', () => {
            render(<LoginPage onLogin={mockOnLogin} />);

            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            expect(forgotPasswordLink).toBeInTheDocument();
        });

        it('should render sign up link', () => {
            render(<LoginPage onLogin={mockOnLogin} />);

            const signUpLink = screen.getByRole('button', { name: /Sign Up/i });
            expect(signUpLink).toBeInTheDocument();
        });
    });

    describe('Login Flow', () => {
        it('should handle successful login', async () => {
            const user = userEvent.setup();

            ((globalThis as any).fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    token: 'test-token',
                    user: { id: '123', name: 'Test User' },
                }),
            });

            render(<LoginPage onLogin={mockOnLogin} />);

            const emailInput = screen.getByLabelText(/Email Address/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const loginButton = screen.getByRole('button', { name: /Log In/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(loginButton);

            await waitFor(() => {
                expect((globalThis as any).fetch).toHaveBeenCalledWith(
                    '/api/auth/login',
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'test@example.com',
                            password: 'password123',
                        }),
                    })
                );
            });

            await waitFor(() => {
                expect(mockOnLogin).toHaveBeenCalled();
            });
        });

        it('should display error on failed login', async () => {
            const user = userEvent.setup();

            ((globalThis as any).fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: 'Invalid password',
                }),
            });

            render(<LoginPage onLogin={mockOnLogin} />);

            const emailInput = screen.getByLabelText(/Email Address/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const loginButton = screen.getByRole('button', { name: /Log In/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(loginButton);

            await waitFor(() => {
                expect(screen.getByText(/Invalid password/i)).toBeInTheDocument();
            });

            expect(mockOnLogin).not.toHaveBeenCalled();
        });

        it('should show loading state during login', async () => {
            const user = userEvent.setup();

            ((globalThis as any).fetch as any).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ success: true, token: 'test', user: { id: '1', name: 'Test' } }),
                }), 100))
            );

            render(<LoginPage onLogin={mockOnLogin} />);

            const emailInput = screen.getByLabelText(/Email Address/i);
            const passwordInput = screen.getByLabelText(/Password/i);
            const loginButton = screen.getByRole('button', { name: /Log In/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(loginButton);

            // Check for loading state
            expect(screen.getByText(/Logging in/i)).toBeInTheDocument();
            expect(loginButton).toBeDisabled();
        });
    });

    describe('Sign Up Flow', () => {
        it('should switch to sign up form when clicking sign up link', async () => {
            const user = userEvent.setup();

            render(<LoginPage onLogin={mockOnLogin} />);

            const signUpLink = screen.getByRole('button', { name: /Sign Up/i });
            await user.click(signUpLink);

            expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
        });

        it('should handle successful sign up', async () => {
            const user = userEvent.setup();

            // Mock alert
            window.alert = vi.fn();

            ((globalThis as any).fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    user: { user_id: '123', email: 'newuser@example.com' },
                }),
            });

            render(<LoginPage onLogin={mockOnLogin} />);

            // Switch to sign up
            const signUpLink = screen.getByRole('button', { name: /Sign Up/i });
            await user.click(signUpLink);

            // Fill form
            await user.type(screen.getByLabelText(/Full Name/i), 'New User');
            await user.type(screen.getByLabelText(/Email Address/i), 'newuser@example.com');
            const passwordInputs = screen.getAllByLabelText(/Password/i);
            await user.type(passwordInputs[0], 'password123');
            await user.type(screen.getByLabelText(/Confirm Password/i), 'password123');

            // Submit
            const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
            await user.click(signUpButton);

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(
                    expect.stringContaining('Account created successfully')
                );
            });
        });

        it('should show error when passwords do not match', async () => {
            const user = userEvent.setup();

            render(<LoginPage onLogin={mockOnLogin} />);

            // Switch to sign up
            const signUpLink = screen.getByRole('button', { name: /Sign Up/i });
            await user.click(signUpLink);

            // Fill form with mismatched passwords
            await user.type(screen.getByLabelText(/Full Name/i), 'New User');
            await user.type(screen.getByLabelText(/Email Address/i), 'newuser@example.com');
            const passwordInputs = screen.getAllByLabelText(/Password/i);
            await user.type(passwordInputs[0], 'password123');
            await user.type(screen.getByLabelText(/Confirm Password/i), 'differentpassword');

            // Submit
            const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
            await user.click(signUpButton);

            await waitFor(() => {
                expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
            });
        });
    });

    describe('Forgot Password Flow', () => {
        it('should switch to forgot password form', async () => {
            const user = userEvent.setup();

            render(<LoginPage onLogin={mockOnLogin} />);

            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            await user.click(forgotPasswordLink);

            expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
            expect(screen.getByText(/Enter your email to receive a password reset link/i)).toBeInTheDocument();
        });

        it('should send forgot password request', async () => {
            const user = userEvent.setup();

            // Mock alert
            window.alert = vi.fn();

            ((globalThis as any).fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message: 'Password reset link sent to your email.',
                }),
            });

            render(<LoginPage onLogin={mockOnLogin} />);

            // Go to forgot password
            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            await user.click(forgotPasswordLink);

            // Fill email
            const emailInput = screen.getByLabelText(/Email/i);
            await user.type(emailInput, 'test@example.com');

            // Submit
            const sendButton = screen.getByRole('button', { name: /Send Reset Link/i });
            await user.click(sendButton);

            await waitFor(() => {
                expect((globalThis as any).fetch).toHaveBeenCalledWith(
                    '/api/auth/forgot-password',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({ email: 'test@example.com' }),
                    })
                );
            });

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(
                    expect.stringContaining('Password reset link sent')
                );
            });
        });

        it('should display error on forgot password failure', async () => {
            const user = userEvent.setup();

            ((globalThis as any).fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: 'Failed to send reset email',
                }),
            });

            render(<LoginPage onLogin={mockOnLogin} />);

            // Go to forgot password
            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            await user.click(forgotPasswordLink);

            // Fill email
            const emailInput = screen.getByLabelText(/Email/i);
            await user.type(emailInput, 'test@example.com');

            // Submit
            const sendButton = screen.getByRole('button', { name: /Send Reset Link/i });
            await user.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText(/Failed to send reset email/i)).toBeInTheDocument();
            });
        });

        it('should show loading state during forgot password request', async () => {
            const user = userEvent.setup();

            ((globalThis as any).fetch as any).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ success: true, message: 'Sent' }),
                }), 100))
            );

            render(<LoginPage onLogin={mockOnLogin} />);

            // Go to forgot password
            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            await user.click(forgotPasswordLink);

            await user.type(screen.getByLabelText(/Email/i), 'test@example.com');

            const sendButton = screen.getByRole('button', { name: /Send Reset Link/i });
            await user.click(sendButton);

            // Check for loading state
            expect(screen.getByText(/Sending/i)).toBeInTheDocument();
            expect(sendButton).toBeDisabled();
        });

        it('should return to login from forgot password', async () => {
            const user = userEvent.setup();

            render(<LoginPage onLogin={mockOnLogin} />);

            // Go to forgot password
            const forgotPasswordLink = screen.getByRole('button', { name: /Forgot Password/i });
            await user.click(forgotPasswordLink);

            // Click back to login
            const backButton = screen.getByRole('button', { name: /Back to Login/i });
            await user.click(backButton);

            expect(screen.getByText(/Welcome to Hive/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
        });
    });
});
