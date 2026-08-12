import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. The application is running in Local Storage Mode.'
  );
}

const createDummyClient = () => {
  const dummyChain: any = {
    select: () => dummyChain,
    insert: () => dummyChain,
    update: () => dummyChain,
    upsert: () => dummyChain,
    delete: () => dummyChain,
    eq: () => dummyChain,
    order: () => dummyChain,
    limit: () => dummyChain,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ data: null, error: new Error('Supabase is not configured') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase is not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => dummyChain,
  } as any;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();
