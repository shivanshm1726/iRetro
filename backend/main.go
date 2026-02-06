package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"time"
)

// Track represents a music track
type Track struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Artist       string `json:"artist"`
	Duration     int    `json:"duration"`
	ThumbnailURL string `json:"thumbnail_url"`
}

// SearchResponse from JioSaavn API
type SearchResponse struct {
	Results []struct {
		ID       string `json:"id"`
		Title    string `json:"title"`
		Subtitle string `json:"subtitle"`
		Image    string `json:"image"`
		Duration string `json:"duration"`
		URL      string `json:"url"`
	} `json:"results"`
}

// Config
var (
	port        = getEnv("PORT", "8080")
	jiosaavnAPI = "https://jiosaavn-api-privatecvc2.vercel.app"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func main() {
	// Setup routes
	http.HandleFunc("/api/search", corsMiddleware(handleSearch))
	http.HandleFunc("/api/stream/", corsMiddleware(handleStream))
	http.HandleFunc("/api/health", corsMiddleware(handleHealth))
	http.HandleFunc("/", corsMiddleware(handleStatic))

	log.Printf("🎵 iRetro Server starting on port %s", port)
	log.Printf("📡 API endpoints:")
	log.Printf("   GET /api/search?q=<query>")
	log.Printf("   GET /api/stream/<id>")
	log.Printf("   GET /api/health")

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

// CORS middleware
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Range")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Health check endpoint
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "iretro-server",
		"version": "2.0.0",
	})
}

// Search endpoint - uses JioSaavn API
func handleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}

	log.Printf("🔍 Searching for: %s", query)

	// Call JioSaavn API
	searchURL := fmt.Sprintf("%s/search/songs?query=%s&limit=20", jiosaavnAPI, url.QueryEscape(query))

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(searchURL)
	if err != nil {
		log.Printf("❌ Search error: %v", err)
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var apiResp struct {
		Status string `json:"status"`
		Data   struct {
			Results []struct {
				ID             string `json:"id"`
				Name           string `json:"name"`
				Duration       string `json:"duration"`
				PrimaryArtists string `json:"primaryArtists"`
				Image          []struct {
					Quality string `json:"quality"`
					Link    string `json:"link"`
				} `json:"image"`
				DownloadURL []struct {
					Quality string `json:"quality"`
					Link    string `json:"link"`
				} `json:"downloadUrl"`
			} `json:"results"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		log.Printf("❌ Parse error: %v", err)
		http.Error(w, "Failed to parse response", http.StatusInternalServerError)
		return
	}

	// Convert to our Track format
	tracks := make([]Track, 0, len(apiResp.Data.Results))
	for _, result := range apiResp.Data.Results {
		thumbnail := ""
		if len(result.Image) > 0 {
			thumbnail = result.Image[len(result.Image)-1].Link // Get highest quality
		}

		duration := 0
		fmt.Sscanf(result.Duration, "%d", &duration)

		tracks = append(tracks, Track{
			ID:           result.ID,
			Title:        result.Name,
			Artist:       result.PrimaryArtists,
			Duration:     duration,
			ThumbnailURL: thumbnail,
		})
	}

	log.Printf("✅ Found %d tracks", len(tracks))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracks)
}

// Stream endpoint - streams audio from JioSaavn
func handleStream(w http.ResponseWriter, r *http.Request) {
	// Extract ID from path: /api/stream/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/stream/")
	id := strings.TrimSuffix(path, "/")

	if id == "" {
		http.Error(w, "Missing track ID", http.StatusBadRequest)
		return
	}

	log.Printf("🎵 Streaming track: %s", id)

	// Get song details from JioSaavn API
	songURL := fmt.Sprintf("%s/songs?id=%s", jiosaavnAPI, id)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(songURL)
	if err != nil {
		log.Printf("❌ Failed to get song info: %v", err)
		http.Error(w, "Failed to get song", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var songResp struct {
		Status string `json:"status"`
		Data   []struct {
			DownloadURL []struct {
				Quality string `json:"quality"`
				Link    string `json:"link"`
			} `json:"downloadUrl"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&songResp); err != nil {
		log.Printf("❌ Parse error: %v", err)
		http.Error(w, "Failed to parse song data", http.StatusInternalServerError)
		return
	}

	if songResp.Status != "SUCCESS" || len(songResp.Data) == 0 || len(songResp.Data[0].DownloadURL) == 0 {
		http.Error(w, "Song not found", http.StatusNotFound)
		return
	}

	// Get highest quality URL (last in array)
	downloadURLs := songResp.Data[0].DownloadURL
	streamURL := downloadURLs[len(downloadURLs)-1].Link

	log.Printf("📡 Proxying audio from: %s", streamURL)

	// Proxy the audio stream
	audioResp, err := http.Get(streamURL)
	if err != nil {
		log.Printf("❌ Stream error: %v", err)
		http.Error(w, "Failed to stream", http.StatusInternalServerError)
		return
	}
	defer audioResp.Body.Close()

	// Set headers for audio streaming
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Accept-Ranges", "bytes")
	if audioResp.ContentLength > 0 {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", audioResp.ContentLength))
	}

	// Stream the audio
	io.Copy(w, audioResp.Body)
}

// Serve static files (for local development)
func handleStatic(w http.ResponseWriter, r *http.Request) {
	// Try to serve from ../web directory
	path := r.URL.Path
	if path == "/" {
		path = "/index.html"
	}

	filePath := "../web" + path
	if _, err := os.Stat(filePath); err == nil {
		http.ServeFile(w, r, filePath)
		return
	}

	http.NotFound(w, r)
}

// Helper to check if yt-dlp is available (for future YouTube support)
func checkYtDlp() bool {
	_, err := exec.LookPath("yt-dlp")
	return err == nil
}
