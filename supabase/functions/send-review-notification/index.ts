import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// Import nodemailer for Deno
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ReviewNotificationRequest {
  reviewId: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment?: string;
  subject?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Review notification function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId, businessId, customerName, customerEmail, rating, comment, subject }: ReviewNotificationRequest = await req.json();
    
    console.log('Processing review notification for:', { reviewId, businessId, customerName, rating });

    // Get business settings and owner info
    const { data: businessData, error: businessError } = await supabase
      .from('business_settings')
      .select(`
        business_name,
        contact_email,
        user_id,
        profiles!inner(full_name, email)
      `)
      .eq('id', businessId)
      .single();

    if (businessError || !businessData) {
      console.error('Error fetching business data:', businessError);
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Business data retrieved:', businessData);

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587', 10),
      secure: Deno.env.get('SMTP_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const stars = '⭐'.repeat(rating);
    const businessName = businessData.business_name;
    const ownerEmail = businessData.profiles.email;
    const ownerName = businessData.profiles.full_name;
    const businessContactEmail = businessData.contact_email;

    // Email to customer (confirmation)
    const customerEmailContent = {
      from: `"${businessName}" <${Deno.env.get('SMTP_USER')}>`,
      to: customerEmail,
      subject: `Thank you for your review - ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Thank you for your feedback!</h2>
          <p>Hi ${customerName},</p>
          <p>Thank you for taking the time to leave us a review. We truly appreciate your feedback!</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Your Review:</h3>
            <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
          </div>
          
          <p>Best regards,<br>
          The ${businessName} Team</p>
        </div>
      `,
    };

    // Prepare list of recipients for the business notification
    const businessRecipients = [ownerEmail, businessContactEmail].filter(email => email);
    // Remove duplicates
    const uniqueBusinessRecipients = [...new Set(businessRecipients)];


    // Email to business owner (notification)
    const businessOwnerEmailContent = {
      from: `"Review System" <${Deno.env.get('SMTP_USER')}>`,
      to: uniqueBusinessRecipients.join(', '),
      subject: `New ${rating}-star review received for ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Review Received!</h2>
          <p>Hi ${ownerName || businessName},</p>
          <p>You've received a new review for <strong>${businessName}</strong>:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
          
          <p>You can view and manage all your reviews in your dashboard.</p>
          
          <p>Best regards,<br>
          Your Review Management System</p>
        </div>
      `,
    };

    // Send both emails
    console.log('Sending customer confirmation email...');
    const customerEmailResult = await transporter.sendMail(customerEmailContent);
    console.log('Customer email sent:', customerEmailResult.messageId);

    if (uniqueBusinessRecipients.length > 0) {
        console.log(`Sending business notification email to: ${uniqueBusinessRecipients.join(', ')}...`);
        const businessEmailResult = await transporter.sendMail(businessOwnerEmailContent);
        console.log('Business owner email sent:', businessEmailResult.messageId);
        return new Response(JSON.stringify({ 
          success: true, 
          customerEmailId: customerEmailResult.messageId,
          businessEmailId: businessEmailResult.messageId 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
    } else {
        console.log('No business recipients to send notification to.');
        return new Response(JSON.stringify({ 
          success: true, 
          customerEmailId: customerEmailResult.messageId,
          businessEmailId: null,
          message: 'Customer email sent, but no business recipients were found.'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
    }

  } catch (error: any) {
    console.error('Error in send-review-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
