// TheirStory API Integration
class TheirStoryIntegration {
    constructor() {
        this.token = null;
        this.baseUrl = 'https://node.theirstory.io';
        this.apiKey = 'fossda-web-editor';
    }

    async fetchWithAuth(url, options = {}) {
        const headers = {
            'Accept': 'application/json',
            'X-API-Key': this.apiKey,
            'Authorization': this.token,
            'Origin': window.location.origin,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                mode: 'cors',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API request failed:', {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorText
                });
                throw new Error(`${response.status} - ${errorText || response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async authenticate(email, password) {
        try {
            console.log('Attempting authentication...', { email });
            const response = await this.fetchWithAuth(`${this.baseUrl}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    visitorId: this.apiKey
                })
            });

            const data = await response.json();
            console.log('Auth response data:', data);

            if (!data.token) {
                throw new Error('No authentication token received');
            }

            this.token = data.token;
            console.log('Authentication successful');
            return data;
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    async testToken() {
        if (!this.token) {
            throw new Error('No token to test');
        }

        console.log('Testing token validity...');
        const response = await this.fetchWithAuth(`${this.baseUrl}/stories`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token test failed:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            throw new Error(`Token test failed: ${response.status}`);
        }

        console.log('Token test successful');
    }

    async listStories() {
        try {
            console.log('Fetching stories...');
            const response = await this.fetchWithAuth(`${this.baseUrl}/stories`);
            const data = await response.json();
            console.log('Successfully fetched stories:', data.length);
            return data;
        } catch (error) {
            console.error('Error fetching stories:', error);
            throw error;
        }
    }

    async fetchStory(storyId) {
        if (!storyId) {
            throw new Error('Story ID is required');
        }

        try {
            console.log('Fetching story:', storyId);
            const response = await this.fetchWithAuth(`${this.baseUrl}/stories/${storyId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching story:', error);
            throw error;
        }
    }

    async fetchStoryTranscript(storyId) {
        if (!storyId) {
            throw new Error('Story ID is required');
        }

        try {
            console.log('Fetching transcript:', storyId);
            const response = await this.fetchWithAuth(`${this.baseUrl}/stories/${storyId}/transcript`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching transcript:', error);
            throw error;
        }
    }

    async fetchStoryRecording(storyId) {
        if (!storyId) {
            throw new Error('Story ID is required');
        }

        try {
            console.log('Fetching recording:', storyId);
            // First get the transcript data to get the video URL
            const transcriptData = await this.fetchTranscriptData(storyId);
            if (!transcriptData.videoURL) {
                throw new Error('No video URL found in transcript data');
            }
            
            // Return the video URL instead of fetching the blob
            return transcriptData.videoURL;
        } catch (error) {
            console.error('Error fetching recording:', error);
            throw error;
        }
    }

    async fetchTranscriptData(storyId) {
        if (!storyId) {
            throw new Error('Story ID is required');
        }

        try {
            console.log('Fetching transcript data:', storyId);
            const response = await this.fetchWithAuth(`${this.baseUrl}/transcripts/${storyId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching transcript data:', error);
            throw error;
        }
    }

    async fetchTranscriptHtml(storyId) {
        if (!storyId) {
            throw new Error('Story ID is required');
        }

        try {
            console.log('Fetching transcript HTML:', storyId);
            const response = await this.fetchWithAuth(`${this.baseUrl}/stories/${storyId}/html`, {
                headers: {
                    'Accept': 'text/html'
                }
            });
            return await response.text();
        } catch (error) {
            console.error('Error fetching transcript HTML:', error);
            throw error;
        }
    }
}

// Initialize TheirStory integration when the page loads
window.theirStoryIntegration = new TheirStoryIntegration(); 