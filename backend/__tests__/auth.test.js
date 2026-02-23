const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the router
const authRouter = require('../src/routes/auth');

// Mock database module
jest.mock('../db', () => ({
    query: jest.fn(),
}));

// Mock email service
jest.mock('../src/services/emailService', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}));

const db = require('../db');
const emailService = require('../src/services/emailService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Authentication Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/signup', () => {
        it('should create a new user successfully', async () => {
            const mockUser = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
            };

            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual(mockUser);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining(['test@example.com'])
            );
        });

        it('should return error when user already exists', async () => {
            db.query.mockRejectedValueOnce(new Error('Duplicate key error'));

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(response.status).toBe(500);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUser = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                password_hash: hashedPassword,
                display_name: 'Test User',
            };

            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.name).toBe('Test User');
        });

        it('should return error with invalid email', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User not found');
        });

        it('should return error with invalid password', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const mockUser = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                password_hash: hashedPassword,
                display_name: 'Test User',
            };

            db.query.mockResolvedValueOnce({ rows: [mockUser] });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid password');
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should send password reset email for existing user', async () => {
            const mockUser = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                display_name: 'Test User',
            };

            // Mock user lookup
            db.query.mockResolvedValueOnce({ rows: [mockUser] });
            // Mock delete existing tokens
            db.query.mockResolvedValueOnce({ rows: [] });
            // Mock insert new token
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'test@example.com',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('reset link sent');
            expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
                'test@example.com',
                expect.any(String)
            );
        });

        it('should return generic success for non-existent user (security)', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'nonexistent@example.com',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('should reset password with valid token', async () => {
            const mockToken = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                expires_at: new Date(Date.now() + 3600000), // Future date
            };

            // Mock token lookup
            db.query.mockResolvedValueOnce({ rows: [mockToken] });
            // Mock password update
            db.query.mockResolvedValueOnce({ rows: [] });
            // Mock token deletion
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'valid-token',
                    newPassword: 'newpassword123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successfully');
        });

        it('should reject invalid token', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'invalid-token',
                    newPassword: 'newpassword123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid or expired');
        });

        it('should reject expired token', async () => {
            const mockToken = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                expires_at: new Date(Date.now() - 3600000), // Past date
            };

            db.query.mockResolvedValueOnce({ rows: [mockToken] });
            db.query.mockResolvedValueOnce({ rows: [] }); // Delete token

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'expired-token',
                    newPassword: 'newpassword123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('expired');
        });
    });
});
