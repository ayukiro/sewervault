document.addEventListener('DOMContentLoaded', function() {
    // Format selection modal elements
    const formatModal = document.getElementById('formatModal');
    const formatSelectionContainer = document.getElementById('formatSelectionContainer');
    const processingContainer = document.getElementById('processingContainer');
    const formatOptions = document.querySelectorAll('.format-option');
    const formatCancelBtn = document.getElementById('formatCancelBtn');
    const formatDownloadBtn = document.getElementById('formatDownloadBtn');
    
    // Variables to store current track info
    let currentTrackPath = '';
    let currentTrackTitle = '';
    let currentAlbum = '';
    let currentType = '';
    let selectedFormat = '';
    
    // Add event listeners to format options
    formatOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            formatOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Store selected format
            selectedFormat = this.getAttribute('data-format');
            
            // Enable download button
            formatDownloadBtn.disabled = false;
        });
    });
    
    // Cancel button click event
    formatCancelBtn.addEventListener('click', function() {
        closeFormatModal();
    });
    
    // Download button click event
    formatDownloadBtn.addEventListener('click', function() {
        if (!selectedFormat) return;
        
        handleDownload(selectedFormat);
    });
    
    // Close modal by clicking outside
    formatModal.addEventListener('click', function(e) {
        if (e.target === formatModal) {
            closeFormatModal();
        }
    });
    
    // Override download buttons for FLAC tracks
    function initFormatSelector() {
        document.addEventListener('click', function(e) {
            const downloadBtn = e.target.closest('.download-btn');
            
            if (downloadBtn) {
                const trackItem = downloadBtn.closest('.track-item');
                if (!trackItem) return;
                
                // Check if it's a FLAC file
                const formatElement = trackItem.querySelector('.track-format');
                if (formatElement && formatElement.textContent.trim() === 'FLAC') {
                    e.preventDefault(); // Prevent default download
                    
                    // Get track information
                    const filePath = downloadBtn.getAttribute('href');
                    
                    // Clean up the path - remove any leading './music/' to just get the relative path
                    const cleanPath = filePath.replace(/^\.?\/?music\//, '');
                    
                    const title = trackItem.querySelector('.track-title').textContent;
                    
                    // Get album and type information
                    const albumElement = trackItem.querySelector('.album-name');
                    const typeElement = trackItem.querySelector('.track-type');
                    
                    // Store album and type if they exist
                    currentAlbum = albumElement ? albumElement.textContent : '';
                    currentType = typeElement ? typeElement.textContent.trim() : '';
                    
                    // Show format selection modal
                    openFormatModal(cleanPath, title, currentAlbum, currentType);
                }
            }
        });
    }
    
    // Open format selection modal
    function openFormatModal(filePath, title, album, type) {
        currentTrackPath = filePath;
        currentTrackTitle = title;
        currentAlbum = album;
        currentType = type;
        selectedFormat = '';
        
        // Reset state
        formatOptions.forEach(opt => opt.classList.remove('selected'));
        formatDownloadBtn.disabled = true;
        
        // Show download whole album option only for EP and Album types
        const albumOptionElement = document.getElementById('download-album-option');
        if (albumOptionElement) {
            if (type === 'EP' || type === 'Album') {
                albumOptionElement.style.display = 'flex';
                // Update the text based on type
                const albumTypeText = type === 'EP' ? 'EP' : 'Album';
                const albumTitleElement = albumOptionElement.querySelector('.format-name');
                if (albumTitleElement) {
                    albumTitleElement.innerHTML = `Download Entire ${albumTypeText} <span class="format-badge badge-flac">ZIP</span>`;
                }
                const albumDescElement = albumOptionElement.querySelector('.format-description');
                if (albumDescElement) {
                    albumDescElement.textContent = `Download all tracks from "${album}" as a ZIP archive in the best available quality.`;
                }
            } else {
                albumOptionElement.style.display = 'none';
            }
        }
        
        // Show selection container, hide processing
        formatSelectionContainer.style.display = 'block';
        processingContainer.classList.remove('active');
        
        // Show modal
        formatModal.classList.add('active');
    }
    
    // Close format selection modal
    function closeFormatModal() {
        formatModal.classList.remove('active');
    }
    
    // Handle download based on selected format
    function handleDownload(format) {
        if (format === 'flac') {
            // Direct download of the original FLAC file
            window.location.href = `./music/${currentTrackPath}`;
            closeFormatModal();
        } else if (format === 'album-zip') {
            // Download the album as a ZIP
            
            // Show processing animation
            formatSelectionContainer.style.display = 'none';
            processingContainer.classList.add('active');
            
            // Update processing text
            const processingText = document.querySelector('.processing-text');
            const processingSubtitle = document.querySelector('.processing-subtitle');
            if (processingText) processingText.textContent = 'Creating Album Archive...';
            if (processingSubtitle) processingSubtitle.textContent = 'Preparing ZIP file with all tracks from the album. This may take a moment.';
            
            // Call the album ZIP creation API
            downloadAlbumZip(currentAlbum, currentType);
        } else {
            // Convert to MP3
            const bitrate = format === 'mp3-320' ? '320' : '192';
            
            // Show processing animation
            formatSelectionContainer.style.display = 'none';
            processingContainer.classList.add('active');
            
            // Call the conversion API
            convertAndDownload(currentTrackPath, bitrate);
        }
    }
    
    // Download album as ZIP
    function downloadAlbumZip(album, type) {
        const url = `create_album_zip.php?album=${encodeURIComponent(album)}&type=${encodeURIComponent(type)}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // ZIP creation succeeded, download the file
                    const downloadPath = data.file;
                    
                    // Trigger download after a small delay
                    setTimeout(() => {
                        window.location.href = downloadPath;
                        
                        // Close modal after download starts
                        setTimeout(() => {
                            closeFormatModal();
                        }, 1000);
                    }, 500);
                } else {
                    // Show error
                    alert(`Creating album ZIP failed: ${data.message}`);
                    closeFormatModal();
                }
            })
            .catch(error => {
                alert('An error occurred while creating the album ZIP. Please try again.');
                closeFormatModal();
            });
    }
    
    // Convert FLAC to MP3 and download
    function convertAndDownload(filePath, bitrate) {
        // Show processing animation right away
        formatSelectionContainer.style.display = 'none';
        processingContainer.classList.add('active');
        
        // Create URL with query parameters
        const url = `convert.php?file=${encodeURIComponent(filePath)}&bitrate=${bitrate}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Conversion succeeded, download the file
                    const downloadPath = data.file;
                    
                    // Trigger download after a small delay to allow user to see the success state
                    setTimeout(() => {
                        window.location.href = downloadPath;
                        
                        // Close modal after download starts
                        setTimeout(() => {
                            closeFormatModal();
                        }, 1000);
                    }, 500);
                } else {
                    // Show error
                    alert(`Conversion failed: ${data.message}`);
                    closeFormatModal();
                }
            })
            .catch(error => {
                alert('An error occurred during conversion. Please try again.');
                closeFormatModal();
            });
    }
    
    // Initialize format selector
    initFormatSelector();
}); 