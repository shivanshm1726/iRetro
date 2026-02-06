/**
 * iRetro - iPod Music Player
 * A simple web frontend that connects to the backend API
 * Version: 2.0.0 - Go Backend
 */

// ============================================================================
// Configuration
// ============================================================================

// Backend API URL - use same origin in production, localhost for development
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : window.location.origin;

console.log('[iRetro v2.0.0] API_BASE:', API_BASE);

// ============================================================================
// State
// ============================================================================

const state = {
    currentView: 'menu',
    viewStack: ['menu'],
    menuIndex: 0,
    searchResults: [],
    searchIndex: 0,
    likedSongsIndex: 0,
    currentTrack: null,
    isPlaying: false,
    theme: 'silver',
    // Queue/playlist for next/previous navigation
    queue: [],
    queueIndex: -1,
    // Liked songs
    likedSongs: [],
    // Hold-to-seek
    seekInterval: null,
    seekDirection: null,
    // Auth state
    user: null,
    isSupabaseConfigured: false,
};

// ============================================================================
// DOM Elements
// ============================================================================

const $ = (id) => document.getElementById(id);

const elements = {
    device: document.querySelector('.ipod-device'),
    statusTitle: $('statusTitle'),
    playingIndicator: $('playingIndicator'),
    
    // Views
    menuView: $('menuView'),
    nowPlayingView: $('nowPlayingView'),
    searchView: $('searchView'),
    settingsView: $('settingsView'),
    likedSongsView: $('likedSongsView'),
    
    // Now Playing
    artwork: $('artwork'),
    artworkPlaceholder: $('artworkPlaceholder'),
    trackTitle: $('trackTitle'),
    trackArtist: $('trackArtist'),
    currentTime: $('currentTime'),
    totalTime: $('totalTime'),
    progressFill: $('progressFill'),
    likeBtn: $('likeBtn'),
    
    // Liked Songs
    likedSongsList: $('likedSongsList'),
    
    // Search
    searchInput: $('searchInput'),
    searchResults: $('searchResults'),
    
    // Audio
    audioPlayer: $('audioPlayer'),
    
    // Buttons
    btnMenu: $('btnMenu'),
    btnPrev: $('btnPrev'),
    btnNext: $('btnNext'),
    btnPlayPause: $('btnPlayPause'),
    btnSelect: $('btnSelect'),
    
    // Auth
    authModal: $('authModal'),
    authForm: $('authForm'),
    authEmail: $('authEmail'),
    authPassword: $('authPassword'),
    authError: $('authError'),
    authSubmit: $('authSubmit'),
    authModalTitle: $('authModalTitle'),
    authSwitchText: $('authSwitchText'),
    authSwitchBtn: $('authSwitchBtn'),
    authModalClose: $('authModalClose'),
    menuAccountItem: $('menuAccountItem'),
    menuAccountText: $('menuAccountText'),
};

// ============================================================================
// View Management
// ============================================================================

function showView(viewName) {
    // Hide all views
    elements.menuView.style.display = 'none';
    elements.nowPlayingView.style.display = 'none';
    elements.searchView.style.display = 'none';
    elements.settingsView.style.display = 'none';
    elements.likedSongsView.style.display = 'none';
    
    // Show selected view
    const viewElement = $(`${viewName}View`);
    if (viewElement) {
        viewElement.style.display = 'flex';
    }
    
    // Update status title
    const titles = {
        menu: 'iRetro',
        nowPlaying: 'Now Playing',
        search: 'Search',
        settings: 'Settings',
        likedSongs: 'Liked Songs'
    };
    elements.statusTitle.textContent = titles[viewName] || 'Monad';
    
    state.currentView = viewName;
    
    // Focus search input when entering search view
    if (viewName === 'search') {
        setTimeout(() => elements.searchInput.focus(), 100);
    }
    
    // Render liked songs when entering that view
    if (viewName === 'likedSongs') {
        renderLikedSongs();
    }
}

function navigateTo(viewName) {
    state.viewStack.push(viewName);
    showView(viewName);
}

function navigateBack() {
    if (state.viewStack.length > 1) {
        state.viewStack.pop();
        const previousView = state.viewStack[state.viewStack.length - 1];
        showView(previousView);
    }
}

// ============================================================================
// Menu Navigation
// ============================================================================

function updateMenuSelection() {
    const items = elements.menuView.querySelectorAll('.ipod-list__item');
    items.forEach((item, index) => {
        item.classList.toggle('ipod-list__item--selected', index === state.menuIndex);
    });
}

function menuUp() {
    const items = elements.menuView.querySelectorAll('.ipod-list__item');
    state.menuIndex = Math.max(0, state.menuIndex - 1);
    updateMenuSelection();
}

function menuDown() {
    const items = elements.menuView.querySelectorAll('.ipod-list__item');
    state.menuIndex = Math.min(items.length - 1, state.menuIndex + 1);
    updateMenuSelection();
}

function menuSelect() {
    const items = elements.menuView.querySelectorAll('.ipod-list__item');
    const selectedItem = items[state.menuIndex];
    if (selectedItem) {
        // Check if it's the account item
        if (selectedItem.id === 'menuAccountItem') {
            handleAccountClick();
            return;
        }
        const viewName = selectedItem.dataset.view;
        if (viewName) {
            navigateTo(viewName);
        }
    }
}

// ============================================================================
// Search
// ============================================================================

let searchTimeout = null;

async function performSearch(query) {
    if (!query.trim()) {
        elements.searchResults.innerHTML = '<div class="ipod-search__empty">Type to search</div>';
        state.searchResults = [];
        return;
    }
    
    elements.searchResults.innerHTML = '<div class="ipod-search__loading">Searching...</div>';
    
    try {
        console.log('[iRetro] Searching for:', query);
        console.log('[iRetro] URL:', `${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('[iRetro] Response status:', response.status);
        
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        
        const data = await response.json();
        
        // Handle both array response (Go backend) and object response (old API)
        const songs = Array.isArray(data) ? data : (data.songs || data.results || []);
        console.log('[iRetro] Got results:', songs.length, 'songs');
        
        state.searchResults = songs;
        state.searchIndex = 0;
        renderSearchResults();
    } catch (error) {
        console.error('[iRetro] Search error:', error);
        if (error.name === 'AbortError') {
            elements.searchResults.innerHTML = '<div class="ipod-search__empty">Search timed out. Server may be waking up, try again.</div>';
        } else {
            elements.searchResults.innerHTML = `<div class="ipod-search__empty">Search failed: ${error.message}</div>`;
        }
    }
}

function renderSearchResults() {
    if (state.searchResults.length === 0) {
        elements.searchResults.innerHTML = '<div class="ipod-search__empty">No results found</div>';
        return;
    }
    
    elements.searchResults.innerHTML = state.searchResults.map((track, index) => `
        <div class="ipod-search__item ${index === state.searchIndex ? 'ipod-search__item--selected' : ''}" data-index="${index}">
            <img class="ipod-search__item-thumb" src="${track.thumbnail_url || `https://i.ytimg.com/vi/${track.id}/default.jpg`}" alt="">
            <div class="ipod-search__item-info">
                <div class="ipod-search__item-title">${escapeHtml(track.title)}</div>
                <div class="ipod-search__item-artist">${escapeHtml(track.artist)}</div>
            </div>
            <div class="ipod-search__item-duration">${formatDuration(track.duration_secs)}</div>
        </div>
    `).join('');
    
    // Add click handlers
    elements.searchResults.querySelectorAll('.ipod-search__item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            state.searchIndex = index;
            renderSearchResults();
            selectSearchResult();
        });
    });
}

function searchUp() {
    if (state.searchResults.length > 0) {
        state.searchIndex = Math.max(0, state.searchIndex - 1);
        renderSearchResults();
        scrollSearchResultIntoView();
    }
}

function searchDown() {
    if (state.searchResults.length > 0) {
        state.searchIndex = Math.min(state.searchResults.length - 1, state.searchIndex + 1);
        renderSearchResults();
        scrollSearchResultIntoView();
    }
}

function scrollSearchResultIntoView() {
    const selected = elements.searchResults.querySelector('.ipod-search__item--selected');
    if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function selectSearchResult() {
    const track = state.searchResults[state.searchIndex];
    if (track) {
        // Set the search results as the current queue
        state.queue = [...state.searchResults];
        state.queueIndex = state.searchIndex;
        playTrack(track);
    }
}

// ============================================================================
// Audio Playback
// ============================================================================

function playTrack(track) {
    state.currentTrack = track;
    
    // Update UI
    elements.trackTitle.textContent = track.title;
    elements.trackArtist.textContent = track.artist;
    
    // Set artwork
    const thumbnailUrl = track.thumbnail_url || `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
    elements.artwork.src = thumbnailUrl;
    elements.artwork.style.display = 'block';
    elements.artworkPlaceholder.style.display = 'none';
    
    elements.artwork.onerror = () => {
        elements.artwork.style.display = 'none';
        elements.artworkPlaceholder.style.display = 'flex';
    };
    
    // Update like button state
    updateLikeButton();
    
    // Set audio source
    const audioUrl = `${API_BASE}/api/stream/${track.id}`;
    elements.audioPlayer.src = audioUrl;
    elements.audioPlayer.play()
        .then(() => {
            state.isPlaying = true;
            updatePlayingIndicator();
        })
        .catch(err => {
            console.error('Playback error:', err);
            alert('Failed to play track. Make sure the backend server is running.');
        });
    
    // Navigate to now playing
    navigateTo('nowPlaying');
}

function togglePlayPause() {
    if (!state.currentTrack) return;
    
    if (state.isPlaying) {
        elements.audioPlayer.pause();
        state.isPlaying = false;
    } else {
        elements.audioPlayer.play();
        state.isPlaying = true;
    }
    updatePlayingIndicator();
}

function updatePlayingIndicator() {
    elements.playingIndicator.style.display = state.isPlaying ? 'flex' : 'none';
}

function updateProgress() {
    const audio = elements.audioPlayer;
    if (audio.duration && isFinite(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        elements.progressFill.style.width = `${percent}%`;
        elements.currentTime.textContent = formatTime(audio.currentTime);
        elements.totalTime.textContent = formatTime(audio.duration);
    }
}

// ============================================================================
// Settings / Themes
// ============================================================================

function setTheme(theme) {
    // Remove old theme
    elements.device.classList.remove(`theme-${state.theme}`);
    // Add new theme
    elements.device.classList.add(`theme-${theme}`);
    state.theme = theme;
    
    // Update checkmarks
    ['silver', 'blue', 'pink', 'yellow', 'red'].forEach(t => {
        const checkEl = $(`check${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (checkEl) {
            checkEl.textContent = t === theme ? '✓' : '';
        }
    });
    
    // Save preference
    localStorage.setItem('iretro-theme', theme);
}

// ============================================================================
// Liked Songs
// ============================================================================

function loadLikedSongs() {
    try {
        const saved = localStorage.getItem('iretro-liked-songs');
        if (saved) {
            state.likedSongs = JSON.parse(saved);
            console.log(`[iRetro] Loaded ${state.likedSongs.length} liked songs from storage`);
        }
    } catch (err) {
        console.error('[iRetro] Failed to load liked songs:', err);
        state.likedSongs = [];
    }
}

function saveLikedSongs() {
    try {
        localStorage.setItem('iretro-liked-songs', JSON.stringify(state.likedSongs));
        console.log(`[iRetro] Saved ${state.likedSongs.length} liked songs to storage`);
        
        // Sync to cloud if user is logged in
        if (state.user && state.isSupabaseConfigured) {
            syncLikedSongsToCloud();
        }
    } catch (err) {
        console.error('[iRetro] Failed to save liked songs:', err);
    }
}

function isTrackLiked(track) {
    if (!track) return false;
    return state.likedSongs.some(t => t.id === track.id);
}

function toggleLike() {
    if (!state.currentTrack) return;
    
    const isLiked = isTrackLiked(state.currentTrack);
    
    if (isLiked) {
        // Remove from liked songs
        state.likedSongs = state.likedSongs.filter(t => t.id !== state.currentTrack.id);
        console.log(`[iRetro] Unliked: ${state.currentTrack.title}`);
    } else {
        // Add to liked songs
        state.likedSongs.push({ ...state.currentTrack });
        console.log(`[iRetro] Liked: ${state.currentTrack.title}`);
    }
    
    saveLikedSongs();
    updateLikeButton();
}

function updateLikeButton() {
    if (!elements.likeBtn) return;
    
    const isLiked = isTrackLiked(state.currentTrack);
    const icon = elements.likeBtn.querySelector('.like-icon');
    
    if (icon) {
        icon.textContent = isLiked ? '♥' : '♡';
    }
    
    elements.likeBtn.classList.toggle('liked', isLiked);
    elements.likeBtn.title = isLiked ? 'Unlike this song' : 'Like this song';
}

function renderLikedSongs() {
    // Update count in header
    const countEl = document.getElementById('likedSongsCount');
    if (countEl) {
        countEl.textContent = `${state.likedSongs.length} song${state.likedSongs.length !== 1 ? 's' : ''}`;
    }
    
    if (state.likedSongs.length === 0) {
        elements.likedSongsList.innerHTML = `
            <div class="ipod-liked-songs__empty">
                <div class="ipod-liked-songs__empty-icon">💜</div>
                <div>Songs you like will appear here</div>
            </div>`;
        return;
    }
    
    elements.likedSongsList.innerHTML = state.likedSongs.map((track, index) => `
        <div class="ipod-liked-songs__item ${index === state.likedSongsIndex ? 'ipod-liked-songs__item--selected' : ''}" 
             data-index="${index}">
            <div class="ipod-liked-songs__item-number">${index + 1}</div>
            <div class="ipod-liked-songs__item-art">
                <img src="${track.thumbnail_url || ''}" 
                     alt="" 
                     onerror="this.parentElement.innerHTML='🎵'">
            </div>
            <div class="ipod-liked-songs__item-info">
                <div class="ipod-liked-songs__item-title">${escapeHtml(track.title)}</div>
                <div class="ipod-liked-songs__item-artist">${escapeHtml(track.artist || 'Unknown Artist')}</div>
            </div>
            <div class="ipod-liked-songs__item-heart">♥</div>
            <div class="ipod-liked-songs__item-duration">${formatDuration(track.duration)}</div>
        </div>
    `).join('');
    
    // Add click handlers
    elements.likedSongsList.querySelectorAll('.ipod-liked-songs__item').forEach((item, index) => {
        item.addEventListener('click', () => {
            state.likedSongsIndex = index;
            updateLikedSongsSelection();
            selectLikedSong();
        });
    });
}

function updateLikedSongsSelection() {
    const items = elements.likedSongsList.querySelectorAll('.ipod-liked-songs__item');
    items.forEach((item, index) => {
        item.classList.toggle('ipod-liked-songs__item--selected', index === state.likedSongsIndex);
    });
}

function likedSongsUp() {
    if (state.likedSongs.length > 0) {
        state.likedSongsIndex = Math.max(0, state.likedSongsIndex - 1);
        updateLikedSongsSelection();
        scrollLikedSongIntoView();
    }
}

function likedSongsDown() {
    if (state.likedSongs.length > 0) {
        state.likedSongsIndex = Math.min(state.likedSongs.length - 1, state.likedSongsIndex + 1);
        updateLikedSongsSelection();
        scrollLikedSongIntoView();
    }
}

function scrollLikedSongIntoView() {
    const selected = elements.likedSongsList.querySelector('.ipod-liked-songs__item--selected');
    if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function selectLikedSong() {
    const track = state.likedSongs[state.likedSongsIndex];
    if (track) {
        // Set liked songs as the current queue
        state.queue = [...state.likedSongs];
        state.queueIndex = state.likedSongsIndex;
        playTrack(track);
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleMenuButton() {
    if (state.currentView === 'menu') {
        // Already at menu, do nothing
    } else {
        navigateBack();
    }
}

function handleSelectButton() {
    switch (state.currentView) {
        case 'menu':
            menuSelect();
            break;
        case 'search':
            selectSearchResult();
            break;
        case 'likedSongs':
            selectLikedSong();
            break;
        case 'settings':
            // Handle theme selection
            const items = elements.settingsView.querySelectorAll('.ipod-list__item[data-theme]');
            items.forEach(item => {
                if (item.classList.contains('ipod-list__item--selected')) {
                    const theme = item.dataset.theme;
                    if (theme) setTheme(theme);
                }
            });
            break;
        case 'nowPlaying':
            togglePlayPause();
            break;
    }
}

function handlePrevButton() {
    // If we're more than 3 seconds into the song, restart it
    if (state.currentTrack && elements.audioPlayer.currentTime > 3) {
        elements.audioPlayer.currentTime = 0;
        return;
    }
    
    // Otherwise, go to previous track in queue
    if (state.queue.length > 0 && state.queueIndex > 0) {
        state.queueIndex--;
        const track = state.queue[state.queueIndex];
        if (track) {
            playTrackFromQueue(track);
        }
    }
}

function handleNextButton() {
    // Skip to next track in queue
    if (state.queue.length > 0 && state.queueIndex < state.queue.length - 1) {
        state.queueIndex++;
        const track = state.queue[state.queueIndex];
        if (track) {
            playTrackFromQueue(track);
        }
    }
}

// Play a track without modifying the queue (used for next/prev)
function playTrackFromQueue(track) {
    state.currentTrack = track;
    
    // Update UI
    elements.trackTitle.textContent = track.title;
    elements.trackArtist.textContent = track.artist;
    
    // Set artwork
    const thumbnailUrl = track.thumbnail_url || `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
    elements.artwork.src = thumbnailUrl;
    elements.artwork.style.display = 'block';
    elements.artworkPlaceholder.style.display = 'none';
    
    elements.artwork.onerror = () => {
        elements.artwork.style.display = 'none';
        elements.artworkPlaceholder.style.display = 'flex';
    };
    
    // Update like button state
    updateLikeButton();
    
    // Set audio source and play
    const audioUrl = `${API_BASE}/api/stream/${track.id}`;
    elements.audioPlayer.src = audioUrl;
    elements.audioPlayer.play()
        .then(() => {
            state.isPlaying = true;
            updatePlayingIndicator();
        })
        .catch(err => {
            console.error('Playback error:', err);
        });
    
    // If not already on now playing, navigate there
    if (state.currentView !== 'nowPlaying') {
        navigateTo('nowPlaying');
    }
}

function handlePlayPauseButton() {
    if (state.currentTrack) {
        togglePlayPause();
    }
}

// ============================================================================
// Hold-to-Seek Functionality
// ============================================================================

const HOLD_THRESHOLD_MS = 500; // Time before hold action starts
const SEEK_INTERVAL_MS = 100;  // How often to seek while holding
const SEEK_AMOUNT_SECS = 2;    // Seconds to seek per interval

function setupHoldToSeek(button, direction) {
    let holdTimeout = null;
    let isHolding = false;
    
    const startHold = (e) => {
        e.preventDefault();
        isHolding = false;
        
        holdTimeout = setTimeout(() => {
            isHolding = true;
            startSeeking(direction);
        }, HOLD_THRESHOLD_MS);
    };
    
    const endHold = (e) => {
        if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
        }
        
        if (isHolding) {
            // Was holding, stop seeking
            stopSeeking();
        } else {
            // Was a tap, do normal prev/next
            if (direction === 'backward') {
                handlePrevButton();
            } else {
                handleNextButton();
            }
        }
        isHolding = false;
    };
    
    // Mouse events
    button.addEventListener('mousedown', startHold);
    button.addEventListener('mouseup', endHold);
    button.addEventListener('mouseleave', endHold);
    
    // Touch events
    button.addEventListener('touchstart', startHold, { passive: false });
    button.addEventListener('touchend', endHold);
    button.addEventListener('touchcancel', endHold);
}

function startSeeking(direction) {
    state.seekDirection = direction;
    
    // Seek immediately
    performSeek(direction);
    
    // Continue seeking at intervals
    state.seekInterval = setInterval(() => {
        performSeek(direction);
    }, SEEK_INTERVAL_MS);
}

function stopSeeking() {
    if (state.seekInterval) {
        clearInterval(state.seekInterval);
        state.seekInterval = null;
    }
    state.seekDirection = null;
}

function performSeek(direction) {
    if (!state.currentTrack || !elements.audioPlayer.duration) return;
    
    const currentTime = elements.audioPlayer.currentTime;
    const duration = elements.audioPlayer.duration;
    
    if (direction === 'forward') {
        elements.audioPlayer.currentTime = Math.min(currentTime + SEEK_AMOUNT_SECS, duration);
    } else {
        elements.audioPlayer.currentTime = Math.max(currentTime - SEEK_AMOUNT_SECS, 0);
    }
}

// ============================================================================
// Utilities
// ============================================================================

function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (!seconds) return '';
    return formatTime(seconds);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// Authentication
// ============================================================================

let authMode = 'signin'; // 'signin' or 'signup'

function showAuthModal() {
    if (elements.authModal) {
        elements.authModal.style.display = 'flex';
        elements.authEmail.focus();
    }
}

function hideAuthModal() {
    if (elements.authModal) {
        elements.authModal.style.display = 'none';
        elements.authForm.reset();
        elements.authError.style.display = 'none';
    }
}

function setAuthMode(mode) {
    authMode = mode;
    if (mode === 'signup') {
        elements.authModalTitle.textContent = 'Create Account';
        elements.authSubmit.textContent = 'Sign Up';
        elements.authSwitchText.textContent = 'Already have an account?';
        elements.authSwitchBtn.textContent = 'Sign In';
    } else {
        elements.authModalTitle.textContent = 'Sign In';
        elements.authSubmit.textContent = 'Sign In';
        elements.authSwitchText.textContent = "Don't have an account?";
        elements.authSwitchBtn.textContent = 'Sign Up';
    }
    elements.authError.style.display = 'none';
}

function showAuthError(message) {
    elements.authError.textContent = message;
    elements.authError.style.display = 'block';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    if (!state.isSupabaseConfigured) {
        showAuthError('Supabase not configured. Please add your credentials.');
        return;
    }
    
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    
    elements.authSubmit.disabled = true;
    elements.authSubmit.textContent = authMode === 'signup' ? 'Creating...' : 'Signing in...';
    
    try {
        if (authMode === 'signup') {
            const result = await SupabaseAuth.signUp(email, password);
            console.log('[iRetro] Signup result:', result);
            
            // Check if user is already confirmed (email confirmation disabled)
            if (result.user && result.session) {
                // User is auto-confirmed, log them in
                hideAuthModal();
                await handleUserLoggedIn();
            } else if (result.user && !result.session) {
                // Email confirmation required
                showAuthError('Check your email for verification link!');
                elements.authError.style.background = 'rgba(100, 255, 100, 0.15)';
                elements.authError.style.borderColor = 'rgba(100, 255, 100, 0.3)';
                elements.authError.style.color = '#6bff6b';
            }
        } else {
            await SupabaseAuth.signIn(email, password);
            hideAuthModal();
            await handleUserLoggedIn();
        }
    } catch (err) {
        console.error('[iRetro] Auth error:', err);
        showAuthError(err.message || 'Authentication failed');
    } finally {
        elements.authSubmit.disabled = false;
        setAuthMode(authMode); // Reset button text
    }
}

async function handleUserLoggedIn() {
    state.user = await SupabaseAuth.getUser();
    console.log('[iRetro] User logged in:', state.user?.email);
    updateAccountUI();
    
    // Fetch liked songs from cloud and merge with local
    await fetchAndMergeLikedSongs();
}

async function handleUserLoggedOut() {
    state.user = null;
    console.log('[iRetro] User logged out');
    updateAccountUI();
}

function updateAccountUI() {
    if (!elements.menuAccountText) return;
    
    if (state.user) {
        // User is logged in - show email
        const email = state.user.email;
        const shortEmail = email.length > 15 ? email.substring(0, 12) + '...' : email;
        elements.menuAccountText.textContent = shortEmail;
    } else {
        // User is logged out
        elements.menuAccountText.textContent = 'Account';
    }
}

async function handleAccountClick() {
    if (state.user) {
        // User is logged in, ask to sign out
        if (confirm('Sign out of ' + state.user.email + '?')) {
            try {
                await SupabaseAuth.signOut();
                await handleUserLoggedOut();
            } catch (err) {
                console.error('[iRetro] Sign out error:', err);
            }
        }
    } else {
        // User is logged out, show auth modal
        if (!state.isSupabaseConfigured) {
            alert('Supabase not configured. Edit web/supabase.js to add your credentials.');
            return;
        }
        showAuthModal();
    }
}

async function syncLikedSongsToCloud() {
    if (!state.user || !state.isSupabaseConfigured) return;
    
    console.log('[iRetro] Syncing to cloud...');
    
    try {
        await SupabaseAuth.syncLikedSongs(state.likedSongs);
        console.log('[iRetro] Synced to cloud');
    } catch (err) {
        console.error('[iRetro] Sync error:', err);
    }
}

async function fetchAndMergeLikedSongs() {
    if (!state.user || !state.isSupabaseConfigured) return;
    
    try {
        const cloudSongs = await SupabaseAuth.fetchLikedSongs();
        
        if (cloudSongs && cloudSongs.length > 0) {
            // Merge cloud songs with local songs (cloud wins for duplicates)
            const songMap = new Map();
            
            // Add local songs first
            state.likedSongs.forEach(song => songMap.set(song.id, song));
            
            // Add cloud songs (overwrites duplicates)
            cloudSongs.forEach(song => songMap.set(song.id, song));
            
            state.likedSongs = Array.from(songMap.values());
            
            // Save merged list locally
            localStorage.setItem('iretro-liked-songs', JSON.stringify(state.likedSongs));
            
            console.log(`[iRetro] Merged ${cloudSongs.length} cloud songs, total: ${state.likedSongs.length}`);
            
            // Re-render if on liked songs view
            if (state.currentView === 'likedSongs') {
                renderLikedSongs();
            }
        }
    } catch (err) {
        console.error('[iRetro] Failed to fetch cloud songs:', err);
    }
}

async function handleManualSync() {
    if (!state.user) return;
    await syncLikedSongsToCloud();
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

document.addEventListener('keydown', (e) => {
    // Don't intercept keyboard when auth modal is open or typing in inputs
    const isAuthModalOpen = elements.authModal && elements.authModal.style.display !== 'none';
    const isTypingInInput = document.activeElement?.tagName === 'INPUT';
    
    if (isAuthModalOpen || isTypingInInput) {
        // Only handle Escape to close modal
        if (e.key === 'Escape' && isAuthModalOpen) {
            e.preventDefault();
            hideAuthModal();
        }
        return; // Let normal keyboard behavior work
    }
    
    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            if (state.currentView === 'menu') menuUp();
            else if (state.currentView === 'search') searchUp();
            else if (state.currentView === 'likedSongs') likedSongsUp();
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (state.currentView === 'menu') menuDown();
            else if (state.currentView === 'search') searchDown();
            else if (state.currentView === 'likedSongs') likedSongsDown();
            break;
        case 'Enter':
            e.preventDefault();
            handleSelectButton();
            break;
        case 'Escape':
        case 'Backspace':
            e.preventDefault();
            handleMenuButton();
            break;
        case ' ':
            e.preventDefault();
            handlePlayPauseButton();
            break;
    }
});

// ============================================================================
// Initialization
// ============================================================================

async function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('iretro-theme') || 'silver';
    setTheme(savedTheme);
    
    // Load liked songs from localStorage
    loadLikedSongs();
    
    // Initialize Supabase
    if (typeof SupabaseAuth !== 'undefined') {
        state.isSupabaseConfigured = SupabaseAuth.init();
        
        if (state.isSupabaseConfigured) {
            console.log('[iRetro] Supabase configured');
            
            // Check for existing session
            const user = await SupabaseAuth.getUser();
            if (user) {
                state.user = user;
                console.log('[iRetro] Existing session found:', user.email);
                updateAccountUI();
                await fetchAndMergeLikedSongs();
            }
            
            // Listen for auth changes
            SupabaseAuth.onAuthStateChange(async (event, session) => {
                console.log('[iRetro] Auth event:', event);
                if (event === 'SIGNED_IN' && session?.user) {
                    await handleUserLoggedIn();
                } else if (event === 'SIGNED_OUT') {
                    await handleUserLoggedOut();
                }
            });
        } else {
            console.log('[iRetro] Supabase not configured - using local storage only');
        }
    }
    
    // Button event listeners
    elements.btnMenu.addEventListener('click', handleMenuButton);
    elements.btnSelect.addEventListener('click', handleSelectButton);
    elements.btnPlayPause.addEventListener('click', handlePlayPauseButton);
    
    // Prev/Next buttons with hold-to-seek support
    setupHoldToSeek(elements.btnPrev, 'backward');
    setupHoldToSeek(elements.btnNext, 'forward');
    
    // Like button click handler
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike();
        });
    }
    
    // Menu item clicks
    elements.menuView.querySelectorAll('.ipod-list__item').forEach((item, index) => {
        item.addEventListener('click', () => {
            state.menuIndex = index;
            updateMenuSelection();
            // Check if it's the account item
            if (item.id === 'menuAccountItem') {
                handleAccountClick();
            } else {
                menuSelect();
            }
        });
    });
    
    // Settings theme clicks
    elements.settingsView.querySelectorAll('.ipod-list__item[data-theme]').forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.dataset.theme;
            if (theme) setTheme(theme);
        });
    });
    
    // Auth modal handlers
    if (elements.authForm) {
        elements.authForm.addEventListener('submit', handleAuthSubmit);
    }
    if (elements.authModalClose) {
        elements.authModalClose.addEventListener('click', hideAuthModal);
    }
    if (elements.authSwitchBtn) {
        elements.authSwitchBtn.addEventListener('click', () => {
            setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
        });
    }
    // Close modal on backdrop click
    const backdrop = document.querySelector('.auth-modal__backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', hideAuthModal);
    }
    
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });
    
    // Audio events
    elements.audioPlayer.addEventListener('timeupdate', updateProgress);
    elements.audioPlayer.addEventListener('ended', () => {
        state.isPlaying = false;
        updatePlayingIndicator();
        // Auto-play next track if available
        if (state.queue.length > 0 && state.queueIndex < state.queue.length - 1) {
            handleNextButton();
        }
    });
    elements.audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        state.isPlaying = false;
        updatePlayingIndicator();
    });
    
    // Initial view
    showView('menu');
    updateMenuSelection();
    updateAccountUI();
    
    console.log('Monad Web initialized');
    console.log('API endpoint:', API_BASE);
    console.log(`[iRetro] ${state.likedSongs.length} liked songs loaded`);
    console.log(`[iRetro] Supabase configured: ${state.isSupabaseConfigured}`);
}

// Start the app
init();
