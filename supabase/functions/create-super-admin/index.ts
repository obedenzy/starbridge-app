import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, password, fullName } = await req.json()

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating super admin user:', email)

    // Create the user in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || 'Super Admin',
        business_name: 'Platform Administration'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user', details: authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created:', authUser.user.id)

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the existing profile to super admin details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName || 'Super Admin',
        business_name: 'Platform Administration',
        last_login: new Date().toISOString()
      })
      .eq('user_id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: profileError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Assign super admin role (this will also delete any existing business_user role)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authUser.user.id,
        role: 'super_admin'
      }, {
        onConflict: 'user_id,role'
      })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      // Try alternative approach - delete existing roles first
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', authUser.user.id)
      
      // Then insert super admin role
      const { error: roleError2 } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'super_admin'
        })
      
      if (roleError2) {
        console.error('Role assignment error 2:', roleError2)
        return new Response(
          JSON.stringify({ error: 'Failed to assign super admin role', details: roleError2.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log('Super admin created successfully:', authUser.user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          created_at: authUser.user.created_at
        },
        message: 'Super admin account created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})