// Talks to the online database (Supabase). Every call goes through one of
// the fb_* functions created by database-setup.sql.

const cfg = window.FLAMES_CONFIG || {};
const url = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
const key = String(cfg.supabaseKey || '').trim();

export const configured = () => /^https?:\/\//.test(url) && key.length > 10;

let client = null;
function getClient() {
  if (!client) {
    client = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'fb-auth' },
    });
  }
  return client;
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

const MESSAGES = {
  offline: 'No internet connection. Try again when you are online.',
  not_signed_in: 'This phone is not signed in yet. Close the app and open it again.',
  not_member: 'This phone is no longer a member of the band. Join again with the invite code.',
  not_admin: 'Only an admin can do that.',
  bad_code: 'That code is not right. Check it and try again.',
  bad_name: 'Please enter your name (up to 40 letters).',
  bad_role: 'Please choose singer or musician.',
  bad_instrument: 'Please choose what you play.',
  bad_band_name: 'Please enter a band name (up to 60 letters).',
  bad_playlist_name: 'Please give the playlist a name.',
  bad_playlist: 'That playlist could not be saved.',
  bad_logo: 'That picture could not be used. Try a PNG or JPG.',
  too_large: 'That is too big to save. Try a smaller picture or fewer songs.',
  too_many_bands: 'This phone is already in too many bands.',
  too_many_playlists: 'The band has too many playlists. Delete an old one first.',
  band_full: 'This band is full.',
  last_admin: 'The band needs at least one admin. Make someone else an admin first.',
  no_such_member: 'That member is no longer in the band.',
  conflict: 'Another admin changed this playlist.',
  setup: 'The database is not set up yet. Run database-setup.sql in your Supabase project.',
  anon_disabled: 'Anonymous sign-ins are switched off in Supabase. Turn them on under Authentication > Sign In / Providers.',
  rate_limit: 'Too many people joined from this network in the last hour. Wait a little and try again.',
};

function mapError(err) {
  const msg = String(err?.message || err || '');
  const m = /fb:([a-z_]+)/.exec(msg);
  if (m) return new ApiError(m[1], MESSAGES[m[1]] || msg);
  const status = err?.status;
  const name = err?.name || '';
  if (name === 'AuthRetryableFetchError' || /Failed to fetch|NetworkError|Load failed|network/i.test(msg) || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return new ApiError('offline', MESSAGES.offline);
  }
  if (/anonymous sign-?ins are disabled/i.test(msg) || err?.code === 'anonymous_provider_disabled') return new ApiError('anon_disabled', MESSAGES.anon_disabled);
  if (status === 429 || /rate limit/i.test(msg)) return new ApiError('rate_limit', MESSAGES.rate_limit);
  if (err?.code === 'PGRST202' || err?.code === '42883' || /could not find the function/i.test(msg)) return new ApiError('setup', MESSAGES.setup);
  if (err?.code === '42501' || /permission denied/i.test(msg)) return new ApiError('setup', MESSAGES.setup);
  return new ApiError('error', msg || 'Something went wrong. Please try again.');
}

let signingIn = null;

// Each phone gets its own quiet sign-in the first time. No email or password.
export async function ensureUser() {
  const c = getClient();
  const { data, error } = await c.auth.getSession();
  if (error) throw mapError(error);
  if (data?.session?.user) return data.session.user.id;
  if (!signingIn) {
    signingIn = c.auth.signInAnonymously().finally(() => { signingIn = null; });
  }
  const res = await signingIn;
  if (res.error) throw mapError(res.error);
  if (!res.data?.session?.user) throw new ApiError('error', 'Could not sign in. Please try again.');
  return res.data.session.user.id;
}

export async function call(fn, args = {}) {
  if (!configured()) throw new ApiError('setup', 'The app is not connected to a database yet.');
  let res;
  try {
    await ensureUser();
    res = await getClient().rpc('fb_' + fn, args);
  } catch (e) {
    throw e instanceof ApiError ? e : mapError(e);
  }
  if (res.error) throw mapError(res.error);
  return res.data;
}
