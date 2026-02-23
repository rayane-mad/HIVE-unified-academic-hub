const emailService = require('../src/services/emailService');

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({
            messageId: 'test-message-id',
        }),
    }),
}));

describe('Email Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendPasswordResetEmail', () => {
        it('should send email successfully', async () => {
            const result = await emailService.sendPasswordResetEmail(
                'test@example.com',
                'test-token-123'
            );

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should include reset link in email', async () => {
            const nodemailer = require('nodemailer');
            const mockSendMail = nodemailer.createTransport().sendMail;

            await emailService.sendPasswordResetEmail(
                'test@example.com',
                'test-token-123'
            );

            expect(mockSendMail).toHaveBeenCalled();
            const emailOptions = mockSendMail.mock.calls[0][0];

            expect(emailOptions.to).toBe('test@example.com');
            expect(emailOptions.subject).toContain('Password Reset');
            expect(emailOptions.html).toContain('test-token-123');
            expect(emailOptions.html).toContain('reset-password');
        });

        it('should handle email sending errors', async () => {
            const nodemailer = require('nodemailer');
            const mockSendMail = nodemailer.createTransport().sendMail;
            mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

            await expect(
                emailService.sendPasswordResetEmail('test@example.com', 'test-token')
            ).rejects.toThrow('SMTP Error');
        });

        it('should include both HTML and text versions', async () => {
            const nodemailer = require('nodemailer');
            const mockSendMail = nodemailer.createTransport().sendMail;

            await emailService.sendPasswordResetEmail(
                'test@example.com',
                'test-token-123'
            );

            const emailOptions = mockSendMail.mock.calls[0][0];

            expect(emailOptions.html).toBeDefined();
            expect(emailOptions.text).toBeDefined();
            expect(emailOptions.text).toContain('test-token-123');
        });
    });
});
