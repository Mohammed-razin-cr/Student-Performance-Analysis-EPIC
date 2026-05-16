import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Twilio credentials from Environment Variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Email credentials from Environment Variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

export async function POST(req: Request) {
  try {
    const { studentName, email, phone, attendance } = await req.json();

    if (!studentName || !email || !phone) {
      return NextResponse.json({ error: 'Missing student data' }, { status: 400 });
    }

    const messageBody = `Dear ${studentName}, your attendance is below 75% (Current: ${attendance}%). Please attend classes regularly and maintain the required attendance.`;

    let emailSent = false;
    let whatsappSent = false;
    let errors: string[] = [];

    // --- Configuration Check ---
    if (!EMAIL_USER || !EMAIL_PASS) {
      errors.push("EMAIL_USER or EMAIL_PASS environment variable is missing.");
    }
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      errors.push("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_NUMBER environment variable is missing.");
    }

    if (errors.length > 0 && !EMAIL_USER && !TWILIO_ACCOUNT_SID) {
        return NextResponse.json({ 
            success: false, 
            error: "Alert system not configured. Please add Twilio/Email credentials to .env.local",
            details: errors 
        }, { status: 500 });
    }

    // --- Send Email ---
    if (EMAIL_USER && EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"EPIC Student AI" <${EMAIL_USER}>`,
          to: email,
          subject: '⚠️ Low Attendance Alert',
          text: messageBody,
        });
        emailSent = true;
      } catch (e: any) {
        console.error('Email Error:', e);
        errors.push(`Email failed: ${e.message}`);
      }
    } else {
      errors.push('Email credentials not configured');
    }

    // --- Send WhatsApp via Twilio ---
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      try {
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        
        // Normalize phone number: remove non-digits and ensure '+' for international formatting
        let normalizedPhone = phone.replace(/\D/g, '');
        if (!phone.startsWith('+')) {
            // Assume default country code if missing or just add '+' if it looks like it already has it
            normalizedPhone = `+${normalizedPhone}`;
        } else {
            normalizedPhone = phone; 
        }

        const toWhatsApp = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
        const fromWhatsApp = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

        await client.messages.create({
          body: messageBody,
          from: fromWhatsApp,
          to: toWhatsApp,
        });
        whatsappSent = true;
      } catch (e: any) {
        console.error('WhatsApp Error:', e);
        errors.push(`WhatsApp failed: ${e.message}`);
      }
    } else {
      errors.push('Twilio credentials not configured');
    }

    return NextResponse.json({
      success: emailSent || whatsappSent,
      emailSent,
      whatsappSent,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: any) {
    console.error('Alert System Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
