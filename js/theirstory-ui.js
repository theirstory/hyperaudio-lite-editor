// TheirStory UI Integration
class TheirStoryUI {
    constructor() {
        this.authSection = null;
        this.storiesSection = null;
        this.storiesList = null;
        this.emailInput = null;
        this.passwordInput = null;
        this.loginButton = null;
        this.selectedStory = null;
        this.submitButton = null;
        this.initialized = false;
        this.logoutButton = null;
    }

    initialize() {
        // Prevent multiple initializations
        if (this.initialized) {
            return;
        }

        // Get references to elements
        this.authSection = document.getElementById('theirstory-auth-section');
        this.storiesSection = document.getElementById('theirstory-stories-section');
        this.storiesList = document.getElementById('theirstory-stories-list');
        this.emailInput = document.getElementById('theirstory-email');
        this.passwordInput = document.getElementById('theirstory-password');
        this.loginButton = document.getElementById('theirstory-login');
        this.submitButton = document.getElementById('theirstory-submit-btn');
        this.logoutButton = document.getElementById('theirstory-logout');

        if (!this.authSection || !this.loginButton) {
            console.error('TheirStory UI elements not found');
            return;
        }
        
        // Add event listeners
        this.loginButton.addEventListener('click', async (e) => {
            e.preventDefault();
            this.loginButton.classList.add('loading');
            try {
                await this.handleLogin();
                this.loginButton.classList.remove('loading');
            } catch (error) {
                this.loginButton.classList.remove('loading');
                console.error('Login failed');
                alert(error.message);
            }
        });

        // Add logout button listener
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Handle story selection
        if (this.submitButton) {
            this.submitButton.addEventListener('click', () => {
                if (this.selectedStory) {
                    this.handleStorySelect(this.selectedStory);
                }
            });
        }

        // Try auto-login if email exists (don't store password)
        const storedEmail = localStorage.getItem('theirstory_email');
        if (storedEmail) {
            this.emailInput.value = storedEmail;
        }

        this.initialized = true;
    }

    async handleLogin() {
        const email = this.emailInput.value;
        const password = this.passwordInput.value;

        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }

        try {
            await window.theirStoryIntegration.authenticate(email, password);
            await this.loadStories();
            this.authSection.classList.add('hidden');
            this.storiesSection.classList.remove('hidden');
            
            // Only store email, not password
            localStorage.setItem('theirstory_email', email);
        } catch (error) {
            console.error('Login failed');
            throw new Error('Login failed: ' + error.message);
        }
    }

    handleLogout() {
        window.theirStoryIntegration.logout();
        localStorage.removeItem('theirstory_email');
        this.resetUI();
        this.emailInput.value = '';
        this.passwordInput.value = '';
    }

    resetUI() {
        this.authSection.classList.remove('hidden');
        this.storiesSection.classList.add('hidden');
        this.storiesList.innerHTML = '';
        this.selectedStory = null;
        if (this.submitButton) {
            this.submitButton.classList.add('hidden');
        }
    }

    async loadStories() {
        try {
            const stories = await window.theirStoryIntegration.listStories();
            this.storiesList.innerHTML = '';
            
            stories.forEach(story => {
                const storyElement = document.createElement('div');
                storyElement.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                storyElement.textContent = story.title || 'Untitled Story';
                
                storyElement.addEventListener('click', () => {
                    // Remove active class from all stories
                    this.storiesList.querySelectorAll('.active').forEach(el => {
                        el.classList.remove('active', 'bg-primary', 'text-white');
                    });
                    
                    // Add active class to selected story
                    storyElement.classList.add('active', 'bg-primary', 'text-white');
                    
                    // Store the complete story object
                    this.selectedStory = {
                        id: story._id || story.id, // Handle both possible ID fields
                        title: story.title,
                        ...story
                    };
                    console.log('Selected story:', this.selectedStory);
                    
                    // Show submit button
                    if (this.submitButton) {
                        this.submitButton.classList.remove('hidden');
                    }
                });
                
                this.storiesList.appendChild(storyElement);
            });
        } catch (error) {
            console.error('Failed to load stories:', error);
            throw new Error('Failed to load stories: ' + error.message);
        }
    }

    async handleStorySelect(story) {
        try {
            if (!story || !story.id) {
                console.error('Invalid story object:', story);
                throw new Error('Invalid story selected');
            }

            console.log('Handling story selection:', story);
            // Show loading state
            this.submitButton.classList.add('loading');
            
            // Fetch story data
            console.log('Fetching story data for ID:', story.id);
            
            try {
                const [storyData, transcriptHtml, videoUrl] = await Promise.all([
                    window.theirStoryIntegration.fetchStory(story.id),
                    window.theirStoryIntegration.fetchTranscriptHtml(story.id),
                    window.theirStoryIntegration.fetchStoryRecording(story.id)
                ]);
                console.log('Story data fetched:', { storyData });
                console.log('Transcript HTML received');
                console.log('Video URL received:', videoUrl);

                // Update the editor with the story data
                await this.updateEditor(storyData, transcriptHtml, videoUrl);

                // Close the transcribe modal
                const modal = document.getElementById('transcribe-modal');
                if (modal) {
                    modal.checked = false;
                    console.log('Closed transcribe modal');
                } else {
                    console.error('Could not find transcribe modal');
                }
                
                // Reset the UI for next time
                this.resetUI();
                console.log('Reset UI');
            } catch (error) {
                console.error('Error fetching story data:', error);
                throw error;
            } finally {
                // Remove loading state
                this.submitButton.classList.remove('loading');
                console.log('Story selection complete');
            }
        } catch (error) {
            console.error('Failed to load story:', error);
            this.submitButton.classList.remove('loading');
            alert('Failed to load story: ' + error.message);
            throw error;
        }
    }

    async updateEditor(storyData, transcriptHtml, videoUrl) {
        console.log('Updating editor with:', { storyData, videoUrl });
        
        // Update the video/audio source
        const mediaElement = document.querySelector('#hyperplayer');
        if (mediaElement) {
            console.log('Found media element, updating source');
            mediaElement.src = videoUrl;
            
            // Force media element to load the new source
            try {
                await mediaElement.load();
                console.log('Media element loaded new source');
            } catch (error) {
                console.error('Error loading media:', error);
            }
        } else {
            console.error('Could not find media element #hyperplayer');
        }

        // Update the transcript
        const transcriptContainer = document.querySelector('#hypertranscript');
        if (transcriptContainer) {
            console.log('Found transcript container, updating content');
            // Use the HTML transcript directly from the API
            transcriptContainer.innerHTML = transcriptHtml;
            console.log('Updated transcript content');

            // Initialize Hyperaudio after content is updated
            console.log('Initializing Hyperaudio');
            window.document.dispatchEvent(new Event('hyperaudioInit'));
        } else {
            console.error('Could not find transcript container #hypertranscript');
        }
    }

    formatTranscript(transcript) {
        // Convert TheirStory transcript format to Hyperaudio format
        let html = '<article><section>';
        
        transcript.segments.forEach(segment => {
            // Start a new paragraph for each segment
            html += '<p>';
            
            // Add speaker if present
            if (segment.speaker) {
                html += `<span data-m="${segment.start * 1000}" data-d="0" class="speaker">[${segment.speaker}] </span>`;
            }
            
            // Split the text into words and create spans for each
            const words = segment.text.split(' ');
            let currentTime = segment.start * 1000;
            const avgWordDuration = (segment.end - segment.start) * 1000 / words.length;
            
            words.forEach(word => {
                html += `<span data-m="${Math.round(currentTime)}" data-d="${Math.round(avgWordDuration)}">${word} </span>`;
                currentTime += avgWordDuration;
            });
            
            html += '</p>';
        });
        
        html += '</section></article>';
        return html;
    }
}

// Initialize TheirStory UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.theirStoryUI = new TheirStoryUI();
    window.theirStoryUI.initialize();
}); 