import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Payload = {
  action?: 'sync_auth_user' | 'list_team';
  email: string;
  password: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const mainAdminEmail = Deno.env.get('MAIN_ADMIN_EMAIL') || 'sarahb.contato@gmail.com';
    const authHeader = req.headers.get('Authorization') || '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (authData.user.email !== mainAdminEmail) {
      return new Response(JSON.stringify({ error: 'Sem permissão para criar usuário.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const payload = (await req.json()) as Partial<Payload>;
    const action = payload.action || 'sync_auth_user';

    if (action === 'list_team') {
      const { data: teamRows, error: teamError } = await adminClient
        .from('team')
        .select('*')
        .order('created_at', { ascending: false });
      if (teamError) throw teamError;
      return new Response(JSON.stringify({ status: 'ok', rows: teamRows || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = payload.email || '';
    const password = payload.password || '';
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) throw listError;

    const existingUser = usersData.users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser?.id) {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
      });
      if (updateError) throw updateError;

      return new Response(JSON.stringify({ status: 'updated', user_id: existingUser.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    return new Response(JSON.stringify({ status: 'created', user_id: createdUser.user?.id || null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
