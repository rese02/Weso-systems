
'use server';

import nodemailer from 'nodemailer';
import { getHotelById } from './hotel.actions';

interface SendEmailParams {
    hotelId: string;
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ hotelId, to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    const { hotel, error: hotelError } = await getHotelById(hotelId);

    if (hotelError || !hotel) {
        return { success: false, error: `Hotel not found or error fetching hotel: ${hotelError}` };
    }

    const { smtpUser, smtpPass } = hotel;

    if (!smtpUser || !smtpPass) {
        console.error(`SMTP credentials for hotel ${hotelId} are not configured.`);
        // We log the error but don't want to show a scary error to the user for this.
        // The booking is successful, only the email failed.
        return { success: false, error: 'SMTP credentials are not configured for this hotel.' };
    }

    // For this example, we assume Gmail is the provider.
    // In a real app, you might store host and port in the hotel settings as well.
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass, // This should be an "App Password" from Google
        },
    });

    try {
        await transporter.verify(); // Verify the connection configuration
    } catch (error) {
        console.error("SMTP transporter verification failed:", error);
        return { success: false, error: "SMTP configuration is invalid. Could not connect to the mail server." };
    }

    const mailOptions = {
        from: `"${hotel.name}" <${smtpUser}>`,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: `Failed to send email: ${(error as Error).message}` };
    }
}
