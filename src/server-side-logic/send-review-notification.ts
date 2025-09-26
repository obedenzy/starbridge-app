import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Supabase functions use Deno runtime, so Next.js types are not applicable.
// They receive a standard Request object and should return a Response object.

interface ReviewNotificationRequest {
  reviewId: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment?: string;
  subject?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
    });
  }

  try {
    const { record } = await req.json(); // Supabase functions will often parse JSON body into req.json()
    const { reviewId, businessId, customerName, customerEmail, rating, comment, subject }: ReviewNotificationRequest = record;

    // Validate essential environment variables for Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL'); // Use SUPABASE_URL for Edge Functions
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not set.');
      return new Response(JSON.stringify({ error: 'Supabase URL environment variable is not set.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
      return new Response(JSON.stringify({ error: 'Supabase Service Role Key environment variable is not set.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Get business settings and owner info
    const { data: businessData, error: businessError } = await supabase
      .from('business_settings')
      .select(`
        business_name,
        contact_email,
        profiles (
          full_name,
          email
        )
      `)
      .eq('id', businessId)
      .single();

    if (businessError || !businessData) {
      console.error('Error fetching business data:', businessError?.message || 'Business data not found');
      return new Response(JSON.stringify({ error: 'Business not found or error fetching data' }), {
        status: 404, // Return 404 if business not found
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate essential environment variables for Nodemailer
    const emailHost = Deno.env.get('EMAIL_HOST');
    const emailPort = Deno.env.get('EMAIL_PORT');
    const emailSecure = Deno.env.get('EMAIL_SECURE');
    const emailUser = Deno.env.get('EMAIL_USER');
    const emailPass = Deno.env.get('EMAIL_PASS');

    if (!emailHost || !emailUser || !emailPass) {
        console.error('Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS environment variables for Nodemailer.');
        return new Response(JSON.stringify({ error: 'Missing email configuration environment variables.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort || '587', 10),
        secure: emailSecure === 'true',
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const stars = '⭐'.repeat(rating);
    const businessName = businessData.business_name;
    const ownerEmail = businessData.profiles?.email; // Use optional chaining
    const ownerName = businessData.profiles?.full_name; // Use optional chaining
    const businessContactEmail = businessData.contact_email;


    // Email to customer
    const customerMailOptions = {
      from: `"${businessName}" <${emailUser}>`, // Use EMAIL_USER env var directly
      to: customerEmail,
      subject: `Thank you for your review of ${businessName}!`, 
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Thank you for your feedback, ${customerName}!</h2>
          <p>We appreciate you taking the time to share your experience. Your review helps us improve and lets others know about our business.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Your Review:</h3>
            <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
          </div>
          
          <p>Sincerely,<br>The ${businessName} Team</p>
        </div>
      `,
    };

    // Email to business
    const businessRecipients = [ownerEmail, businessContactEmail].filter(email => email);
    const uniqueBusinessRecipients = [...new Set(businessRecipients)];

    const businessMailOptions = {
      from: `"Review Notification" <${emailUser}>`, // Use EMAIL_USER env var directly
      to: uniqueBusinessRecipients.join(', '),
      subject: `New ${rating}-Star Review for ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">You've Received a New Review!</h2>
          <p>Hi ${ownerName || businessName}, a new review has been submitted for your business, <strong>${businessName}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
            <p><strong>Customer's Email:</strong> ${customerEmail}</p>
          </div>
          
          <p>You can view and manage this review in your business dashboard.</p>
          
          <p>Regards,<br>Your Review Management System</p>
        </div>
      `,
    };

    // Send emails
    try {
      const customerEmailResponse = await transporter.sendMail(customerMailOptions);
      console.log('Customer email response:', customerEmailResponse);
    } catch (sendError) {
      console.error('Error sending customer email:', sendError);
      // Decide if you want to fail the entire function or continue if one email fails
    }

    if (uniqueBusinessRecipients.length > 0) {
      try {
        const businessEmailResponse = await transporter.sendMail(businessMailOptions);
        console.log('Business email response:', businessEmailResponse);
      } catch (sendError) {
        console.error('Error sending business email:', sendError);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('General error in send-review-notification Edge Function:', error.message || error);
    return new Response(JSON.stringify({ error: 'Failed to send email', details: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
