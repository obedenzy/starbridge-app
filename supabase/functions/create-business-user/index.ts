import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, fullName, role, businessId, tempPassword } = await req.json()

    // Create the user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        requires_password_change: true
      }
    })

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user account')
    }

    // Add user to business_users table
    const { error: businessUserError } = await supabaseClient
      .from('business_users')
      .insert({
        business_id: businessId,
        user_id: authData.user.id,
        role: role
      })

    if (businessUserError) {
      // If adding to business fails, clean up the created user
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to add user to business: ${businessUserError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        tempPassword 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})