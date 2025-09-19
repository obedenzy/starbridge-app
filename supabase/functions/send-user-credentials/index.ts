import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      userName, 
      tempPassword, 
      businessName, 
      adminEmail, 
      adminName 
    } = await req.json();

    // Create nodemailer transporter
    const transporter = nodemailer.createTransporter({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD'),
      },
    });

    // Email to new user with login credentials
    const userEmailContent = {
      from: `"${businessName}" <${Deno.env.get('SMTP_USER')}>`,
      to: userEmail,
      subject: `Welcome to ${businessName} - Your Login Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to ${businessName}!</h2>
          <p>Hi ${userName},</p>
          <p>You have been added as a user to <strong>${businessName}</strong>. Here are your login credentials:</p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="margin-top: 0; color: #007bff;">Your Login Details</h3>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${tempPassword}</span></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> Please change this temporary password after your first login for security reasons.</p>
          </div>
          
          <p>You can now log in to your account and start using the platform.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>
          
          <p>Best regards,<br>
          The ${businessName} Team</p>
        </div>
      `,
    };

    // Email to business admin with notification
    const adminEmailContent = {
      from: `"User Management System" <${Deno.env.get('SMTP_USER')}>`,
      to: adminEmail,
      subject: `New User Added to ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New User Created</h2>
          <p>Hi ${adminName},</p>
          <p>A new user has been successfully added to <strong>${businessName}</strong>:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">User Details</h3>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Temporary Password:</strong> <span style="font-family: monospace; background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${tempPassword}</span></p>
          </div>
          
          <p>The user has been sent their login credentials via email. They will be required to change their password on first login.</p>
          
          <p>You can manage this user and all other users from your dashboard.</p>
          
          <p>Best regards,<br>
          Your User Management System</p>
        </div>
      `,
    };

    console.log('Sending credentials email to new user...');
    const userEmailResult = await transporter.sendMail(userEmailContent);
    console.log('User credentials email sent:', userEmailResult.messageId);

    console.log('Sending notification email to admin...');
    const adminEmailResult = await transporter.sendMail(adminEmailContent);
    console.log('Admin notification email sent:', adminEmailResult.messageId);

    return new Response(JSON.stringify({ 
      success: true, 
      userEmailId: userEmailResult.messageId,
      adminEmailId: adminEmailResult.messageId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending user credentials emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});