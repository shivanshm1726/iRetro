// Supabase Configuration
// For local development, set these values directly
// For production, these should be injected by your build/deploy process

// Check if running locally or in production
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// For security, use environment variables in production
// For local dev, you can set these directly (they won't be committed if you use .env)
const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
        console.warn('Supabase not configured. Using local storage only.');
        return false;
    }
    
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    } catch (err) {
        console.error('Failed to initialize Supabase:', err);
        return false;
    }
}

// Auth Functions
async function signUp(email, password) {
    if (!supabaseClient) throw new Error('Supabase not configured');
    
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    if (!supabaseClient) throw new Error('Supabase not configured');
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    if (!supabaseClient) throw new Error('Supabase not configured');
    
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

async function getUser() {
    if (!supabaseClient) return null;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

async function getSession() {
    if (!supabaseClient) return null;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

// Liked Songs Database Functions
async function syncLikedSongsToCloud(likedSongs) {
    if (!supabaseClient) return false;
    
    const user = await getUser();
    if (!user) return false;
    
    try {
        // Upsert the liked songs for this user
        const { error } = await supabaseClient
            .from('liked_songs')
            .upsert({
                user_id: user.id,
                songs: likedSongs,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
        
        if (error) throw error;
        console.log('Liked songs synced to cloud');
        return true;
    } catch (err) {
        console.error('Error syncing liked songs:', err);
        return false;
    }
}

async function fetchLikedSongsFromCloud() {
    if (!supabaseClient) return null;
    
    const user = await getUser();
    if (!user) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('liked_songs')
            .select('songs')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }
        
        return data?.songs || [];
    } catch (err) {
        console.error('Error fetching liked songs:', err);
        return null;
    }
}

// Listen for auth state changes
function onAuthStateChange(callback) {
    if (!supabaseClient) return null;
    
    return supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// Export for use in app.js
window.SupabaseAuth = {
    init: initSupabase,
    signUp,
    signIn,
    signOut,
    getUser,
    getSession,
    syncLikedSongs: syncLikedSongsToCloud,
    fetchLikedSongs: fetchLikedSongsFromCloud,
    onAuthStateChange
};
