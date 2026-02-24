const nodemailer = require("nodemailer");

/**
 * EmailService Class
 * Manages SMTP transport and handles single/bulk email delivery.
 */
class EmailService {
    constructor() {
        /**
         * Transporter Configuration
         * Configured for Gmail using environment variables for security.
         * The 'tls' setting allows communication even if SSL certificates are self-signed
         * or not fully verifiable, which helps avoid connection blocks in certain networks.
         */
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verifies the SMTP connection configuration on startup
        this.transporter.verify((error) => {
            if (error) {
                console.log("❌ Email Service Error:", error);
            } else {
                // Connection successful - ready to send emails
            }
        });
    }

    /**
     * Sends a single email.
     * @param {string} fromName - The display name shown to the recipient.
     * @param {string} to - Primary recipient email address.
     * @param {string} subject - The email subject line.
     * @param {string} htmlContent - The body of the email in HTML format.
     * @param {string|Array} cc - Optional Carbon Copy recipient(s).
     * @returns {Promise} Resolves with transmission info or rejects with an error.
     */
    async sendEmail(fromName, to, subject, htmlContent, cc = null) {
        const mailOptions = {
            from: `"${fromName}" <${process.env.EMAIL}>`,
            to,
            cc,
            subject,
            html: htmlContent,
        };

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    }

    /**
     * Sends emails to a list of recipients simultaneously.
     * Useful for company-wide holiday announcements or group notifications.
     * @param {string} fromName - Display name of the sender.
     * @param {Array} recipients - Array of email addresses.
     * @param {string} subject - Email subject line.
     * @param {string} htmlContent - Email body in HTML.
     * @param {string|Array} cc - Optional CC list.
     * @returns {Promise<Object>} Summary object containing success/failure counts and details.
     */
    async sendToMultipleRecipients(fromName, recipients, subject, htmlContent, cc = null) {
        let successCount = 0;
        let failureCount = 0;
        const results = [];

        // Map recipients to an array of promises for concurrent execution
        const emailPromises = recipients.map(async (email) => {
            try {
                const info = await this.sendEmail(fromName, email, subject, htmlContent, cc);
                successCount++;
                results.push({ email, status: 'sent', info });
            } catch (error) {
                failureCount++;
                results.push({ email, status: 'failed', error: error.message });
            }
        });

        // Wait for all email attempts to complete (successful or otherwise)
        await Promise.all(emailPromises);

        return new Promise((resolve) => {
            resolve({
                successCount,
                failureCount,
                totalCount: recipients.length,
                results,
            });
        });
    }
}

module.exports = { EmailService };