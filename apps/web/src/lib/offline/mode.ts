export const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isOfflineMode = () => !isSupabaseConfigured();

export const clearOfflinePersistedState = () => {
  if (typeof window === 'undefined') return;
  if (!isOfflineMode()) return;
  const keys = [
    'datacanvas-auth',
    'datacanvas-projects',
    'datacanvas-datasets',
    'datacanvas-chat',
    'datacanvas-visuals',
    'datacanvas-layout',
  ];
  keys.forEach((key) => window.localStorage.removeItem(key));
};
