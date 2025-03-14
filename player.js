
document.addEventListener('DOMContentLoaded', function() {
    // Audio player elements
    const audioPlayer = document.getElementById('audioPlayer');
    const audioElement = document.getElementById('audioElement');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const progressBar = document.getElementById('progressBar');
    const progressFilled = document.getElementById('progressFilled');
    const progressHover = document.getElementById('progressHover');
    const progressHandle = document.getElementById('progressHandle');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const volumeBar = document.getElementById('volumeBar');
    const volumeFilled = document.getElementById('volumeFilled');
    const volumeHandle = document.getElementById('volumeHandle');
    const volumeIcon = document.getElementById('volumeIcon');
    const playerCover = document.getElementById('playerCover');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    
    // Set initial volume
    audioElement.volume = 0.5;
    
    // Format time function (convert seconds to MM:SS)
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Update progress bar
    function updateProgress() {
        if (isNaN(audioElement.duration)) return;
        
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        progressFilled.style.width = `${percent}%`;
        progressHandle.style.left = `${percent}%`;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
    }
    
    // Update volume display
    function updateVolume() {
        const percent = audioElement.volume * 100;
        volumeFilled.style.width = `${percent}%`;
        volumeHandle.style.left = `${percent}%`;
        
        // Update volume icon based on level
        if (audioElement.volume === 0) {
            volumeIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else if (audioElement.volume < 0.5) {
            volumeIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else {
            volumeIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        }
    }
    
    // Toggle play/pause
    function togglePlayPause() {
        if (audioElement.paused) {
            audioElement.play();
            playPauseIcon.setAttribute('d', 'M6 4h4v16H6V4zm8 0h4v16h-4V4z');
        } else {
            audioElement.pause();
            playPauseIcon.setAttribute('d', 'M5 3l14 9-14 9V3z');
        }
    }
    
    // Play specific track
    function playTrack(filePath, title, artist, coverPath) {
        // Stop current audio if playing
        audioElement.pause();
        
        // Update audio source
        audioElement.src = filePath;
        
        // Update player metadata
        playerTitle.textContent = title;
        playerArtist.textContent = artist;
        playerCover.src = coverPath;
        
        // Show the player
        audioPlayer.classList.add('active');
        
        // Reset progress bar
        progressFilled.style.width = '0%';
        progressHandle.style.left = '0%';
        currentTimeEl.textContent = '0:00';
        
        // Load and play the audio
        audioElement.load();
        audioElement.oncanplaythrough = function() {
            audioElement.play();
            playPauseIcon.setAttribute('d', 'M6 4h4v16H6V4zm8 0h4v16h-4V4z');
            totalTimeEl.textContent = formatTime(audioElement.duration);
        };
    }
    
    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    audioElement.addEventListener('timeupdate', updateProgress);
    
    audioElement.addEventListener('ended', function() {
        playPauseIcon.setAttribute('d', 'M5 3l14 9-14 9V3z');
    });
    
    // Progress bar hover effect
    progressBar.addEventListener('mousemove', function(e) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        if (pos >= 0 && pos <= 1) {
            progressHover.style.width = `${pos * 100}%`;
            
            // Show preview time on hover
            const previewTime = pos * audioElement.duration;
            const timeIndicator = formatTime(previewTime);
            currentTimeEl.textContent = timeIndicator;
        }
    });
    
    progressBar.addEventListener('mouseleave', function() {
        progressHover.style.width = '0';
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
    });
    
    // Progress bar drag functionality
    let isProgressDragging = false;
    
    progressBar.addEventListener('mousedown', function(e) {
        isProgressDragging = true;
        progressBar.classList.add('active');
        updateAudioProgress(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isProgressDragging) {
            updateAudioProgress(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isProgressDragging) {
            isProgressDragging = false;
            progressBar.classList.remove('active');
        }
    });
    
    function updateAudioProgress(e) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        if (pos >= 0 && pos <= 1) {
            audioElement.currentTime = pos * audioElement.duration;
            updateProgress();
        }
    }
    
    // Volume control drag functionality
    let isVolumeDragging = false;
    
    volumeBar.addEventListener('mousedown', function(e) {
        isVolumeDragging = true;
        volumeBar.classList.add('active');
        updateAudioVolume(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isVolumeDragging) {
            updateAudioVolume(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isVolumeDragging) {
            isVolumeDragging = false;
            volumeBar.classList.remove('active');
        }
    });
    
    function updateAudioVolume(e) {
        const rect = volumeBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        if (pos >= 0 && pos <= 1) {
            audioElement.volume = pos;
            updateVolume();
        }
    }
    
    // Volume wheel scroll control
    volumeBar.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        let newVolume = audioElement.volume + delta;
        
        newVolume = Math.max(0, Math.min(1, newVolume));
        audioElement.volume = newVolume;
        updateVolume();
    });
    
    // Volume icon click to mute/unmute
    let lastVolume = audioElement.volume;
    volumeIcon.addEventListener('click', function() {
        if (audioElement.volume > 0) {
            lastVolume = audioElement.volume;
            audioElement.volume = 0;
        } else {
            audioElement.volume = lastVolume;
        }
        updateVolume();
    });
    
    // Initialize volume display
    updateVolume();
    
    // Track click event to play music
    document.addEventListener('click', function(e) {
        // Find closest .download-btn if clicked
        const downloadBtn = e.target.closest('.download-btn');
        
        if (downloadBtn) {
            // Check if it has a play button attribute or if ctrl/cmd key is pressed
            const shouldPlay = e.ctrlKey || e.metaKey;
            
            if (shouldPlay) {
                e.preventDefault(); // Prevent download
                
                // Find parent track-item
                const trackItem = downloadBtn.closest('.track-item');
                if (!trackItem) return;
                
                // Get track information
                const title = trackItem.querySelector('.track-title').textContent;
                const artist = trackItem.querySelector('.track-artist').textContent;
                const filePath = downloadBtn.getAttribute('href');
                const coverImg = trackItem.querySelector('.album-cover img');
                const coverPath = coverImg ? coverImg.getAttribute('src') : './covers/default.png';
                
                // Play the track
                playTrack(filePath, title, artist, coverPath);
            }
        }
    });
    
    // Add play button to each track item
    function addPlayButtonsToTracks() {
        const trackItems = document.querySelectorAll('.track-item');
        
        trackItems.forEach(trackItem => {
            if (!trackItem.querySelector('.play-track-btn')) {
                const downloadBtn = trackItem.querySelector('.download-btn');
                
                // Create play button
                const playBtn = document.createElement('button');
                playBtn.className = 'play-track-btn';
                playBtn.style.cssText = `
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: var(--primary);
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: var(--hover-transition);
                    margin-right: 0.5rem;
                `;
                
                playBtn.innerHTML = `
                    <svg class="control-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3l14 9-14 9V3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
                // Insert before download button
                downloadBtn.parentNode.insertBefore(playBtn, downloadBtn);
                
                // Add click event
                playBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Get track information
                    const title = trackItem.querySelector('.track-title').textContent;
                    const artist = trackItem.querySelector('.track-artist').textContent;
                    const filePath = downloadBtn.getAttribute('href');
                    const coverImg = trackItem.querySelector('.album-cover img');
                    const coverPath = coverImg ? coverImg.getAttribute('src') : './covers/default.png';
                    
                    // Play the track
                    playTrack(filePath, title, artist, coverPath);
                });
            }
        });
    }
    
    // Hook into the track render function to add play buttons
    const originalRenderTracks = window.renderTracks;
    
    if (typeof originalRenderTracks === 'function') {
        window.renderTracks = function(tracks) {
            originalRenderTracks(tracks);
            addPlayButtonsToTracks();
        };
    }
    
    // Call once for initial tracks
    setTimeout(addPlayButtonsToTracks, 500);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Space to play/pause when not typing in an input
        if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            togglePlayPause();
        }
        
        // Arrow keys for seeking
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            
            if (e.key === 'ArrowRight') {
                audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
            } else if (e.key === 'ArrowLeft') {
                audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
            }
        }
    });
});
