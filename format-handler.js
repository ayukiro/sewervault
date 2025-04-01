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
                    
                    // Show format selection modal
                    openFormatModal(cleanPath, title);
                }
            }
        });
    }
    
    // Open format selection modal
    function openFormatModal(filePath, title) {
        currentTrackPath = filePath;
        currentTrackTitle = title;
        selectedFormat = '';
        
        // Reset state
        formatOptions.forEach(opt => opt.classList.remove('selected'));
        formatDownloadBtn.disabled = true;
        
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