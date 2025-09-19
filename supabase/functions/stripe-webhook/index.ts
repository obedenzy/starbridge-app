import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });
        
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.user_id;
          const businessId = session.metadata?.business_id;

          if (userId && businessId) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

            // Update business settings
            await supabaseClient
              .from('business_settings')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: subscription.status,
                subscription_end_date: subscriptionEnd,
                status: 'active' // Activate business account
              })
              .eq('id', businessId);

            logStep("Business subscription activated", { 
              userId, 
              businessId, 
              subscriptionId,
              endDate: subscriptionEnd 
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        
        logStep("Payment failed", { customerId, subscriptionId, invoiceId: invoice.id });

        // Find business by customer ID and mark payment as failed
        const { data: businessData, error } = await supabaseClient
          .from('business_settings')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && businessData) {
          await supabaseClient
            .from('business_settings')
            .update({
              payment_failed_at: new Date().toISOString(),
              // Don't deactivate immediately - give a grace period
            })
            .eq('id', businessData.id);

          logStep("Payment failure recorded", { businessId: businessData.id });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Subscription cancelled", { customerId, subscriptionId: subscription.id });

        // Deactivate business account
        const { data: businessData, error } = await supabaseClient
          .from('business_settings')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && businessData) {
          await supabaseClient
            .from('business_settings')
            .update({
              subscription_status: 'cancelled',
              status: 'inactive' // Deactivate business account
            })
            .eq('id', businessData.id);

          logStep("Business account deactivated due to subscription cancellation", { 
            businessId: businessData.id 
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        logStep("Subscription updated", { 
          customerId, 
          subscriptionId: subscription.id, 
          status: subscription.status 
        });

        // Update business settings
        const { data: businessData, error } = await supabaseClient
          .from('business_settings')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && businessData) {
          // Determine business status based on subscription status
          const businessStatus = ['active', 'trialing'].includes(subscription.status) ? 'active' : 'inactive';
          
          await supabaseClient
            .from('business_settings')
            .update({
              subscription_status: subscription.status,
              subscription_end_date: subscriptionEnd,
              status: businessStatus,
              payment_failed_at: subscription.status === 'active' ? null : businessData.payment_failed_at
            })
            .eq('id', businessData.id);

          logStep("Business settings updated", { 
            businessId: businessData.id, 
            businessStatus,
            subscriptionStatus: subscription.status 
          });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});