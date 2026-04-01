// HyperSecurity Offensive Labs - Downloads Manager
// Dynamically scans and displays files from the downloads folder

/**
 * Floating Notification Manager
 * Shows notifications when downloads start with progress tracking
 */
class NotificationManager {
  constructor() {
    this.notification = null;
    this.notificationText = null;
    this.notificationProgress = null;
    this.notificationProgressBar = null;
    this.closeButton = null;
    this.hideTimeout = null;
  }

  /**
   * Initialize the notification manager
   */
  init() {
    this.notification = document.getElementById('download-notification');
    
    if (!this.notification) {
      console.warn('Download notification element not found');
      return;
    }

    this.notificationText = this.notification.querySelector('.notification-text');
    this.notificationProgress = this.notification.querySelector('.notification-progress');
    this.notificationProgressBar = this.notification.querySelector('.notification-progress-bar');
    this.closeButton = this.notification.querySelector('.notification-close');

    // Add close button event listener
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.hide();
      });
    }
  }

  /**
   * Show notification with custom message
   * @param {string} message - Notification message
   * @param {number} duration - Auto-hide duration in milliseconds (0 = no auto-hide)
   * @param {boolean} showProgress - Show progress bar
   */
  show(message, duration = 3000, showProgress = false) {
    if (!this.notification) return;

    // Update message
    if (this.notificationText) {
      this.notificationText.textContent = message;
    }

    // Show/hide progress bar
    if (this.notificationProgress) {
      if (showProgress) {
        this.notificationProgress.classList.add('active');
      } else {
        this.notificationProgress.classList.remove('active');
        if (this.notificationProgressBar) {
          this.notificationProgressBar.style.width = '0%';
        }
      }
    }

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Show notification
    this.notification.classList.add('show');

    // Auto-hide after duration
    if (duration > 0) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  /**
   * Update progress bar
   * @param {number} progress - Progress percentage (0-100)
   */
  updateProgress(progress) {
    if (!this.notificationProgressBar) return;
    
    this.notificationProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  /**
   * Hide notification
   */
  hide() {
    if (!this.notification) return;

    this.notification.classList.remove('show');

    // Reset progress bar
    if (this.notificationProgress) {
      this.notificationProgress.classList.remove('active');
    }
    if (this.notificationProgressBar) {
      this.notificationProgressBar.style.width = '0%';
    }

    // Clear timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

/**
 * Downloads Manager Class
 * Automatically detects files in the downloads folder and generates download cards
 */
class DownloadsManager {
  constructor() {
    this.downloadsFolder = 'downloads/';
    this.apiFolder = 'api/';
    this.downloadsGrid = null;
    this.notificationManager = new NotificationManager();
    this.fileIcons = {
      // Document types
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'txt': '📃',
      'md': '📋',
      'markdown': '📋',
      
      // Archive types
      'zip': '📦',
      'rar': '📦',
      'tar': '📦',
      'gz': '📦',
      '7z': '📦',
      
      // Executable types
      'exe': '⚙️',
      'sh': '⚙️',
      'bat': '⚙️',
      'bin': '⚙️',
      
      // Code types
      'py': '🐍',
      'js': '📜',
      'rs': '🦀',
      'c': '💻',
      'cpp': '💻',
      'java': '☕',
      
      // Image types
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      
      // Video types
      'mp4': '🎬',
      'avi': '🎬',
      'mov': '🎬',
      
      // Default
      'default': '📁'
    };
    
    // Predefined file metadata (you can customize these)
    this.fileMetadata = {
      'hyperbreach-whitepaper.pdf': {
        title: 'HyperBreach Whitepaper',
        description: 'Technical whitepaper detailing the HyperBreach v7.2.1 platform architecture, capabilities, and implementation details.',
        category: 'Documentation'
      },
      'security-research-paper.pdf': {
        title: 'Security Research Paper',
        description: 'Comprehensive research on advanced offensive security methodologies and breakthrough techniques in penetration testing.',
        category: 'Research'
      },
      'auto-dissolution-technical-guide.pdf': {
        title: 'Auto-Dissolution Technical Guide',
        description: 'In-depth technical guide covering the implementation and deployment of auto-dissolution technology in security testing environments.',
        category: 'Technical Guide'
      }
    };
  }

  /**
   * Initialize the downloads manager
   */
  async init() {
    this.downloadsGrid = document.querySelector('.downloads-grid');
    this.notificationManager.init();
    
    if (!this.downloadsGrid) {
      console.warn('Downloads grid not found');
      return;
    }

    // Try to fetch and display files dynamically
    await this.loadDownloads();
    
    // Add download event listeners
    this.attachDownloadListeners();
    
    // Show dynamic notification when user enters downloads section
    this.setupDownloadsSectionObserver();
  }

  /**
   * Setup Intersection Observer for downloads section
   * Shows dynamic notification based on file availability
   */
  setupDownloadsSectionObserver() {
    const downloadsSection = document.getElementById('downloads');
    
    if (!downloadsSection) return;

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3 // Trigger when 30% of section is visible
    };

    let hasShownWelcome = false;

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasShownWelcome) {
          // Show dynamic notification based on file count
          setTimeout(() => {
            this.showDynamicNotification();
          }, 500);
          hasShownWelcome = true;
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    observer.observe(downloadsSection);
  }

  /**
   * Show dynamic notification based on current file count
   */
  showDynamicNotification() {
    const cards = this.downloadsGrid.querySelectorAll('.download-card');
    const fileCount = cards.length;
    
    if (fileCount === 0) {
      this.notificationManager.show('📭 No downloads available yet', 4000);
    } else if (fileCount === 1) {
      this.notificationManager.show('📥 1 resource available for download', 4000);
    } else {
      this.notificationManager.show(`📥 ${fileCount} resources available for download`, 4000);
    }
  }

  /**
   * Attach event listeners to download buttons
   */
  attachDownloadListeners() {
    // Use event delegation for dynamically added download buttons
    document.addEventListener('click', (e) => {
      const downloadButton = e.target.closest('.download-button');
      if (downloadButton) {
        e.preventDefault();
        
        const fileName = downloadButton.getAttribute('download') || 'file';
        const fileUrl = downloadButton.getAttribute('href');
        
        // Show download starting notification
        this.notificationManager.show(`⬇ Downloading ${fileName}...`, 0);
        
        // Start download with progress tracking
        this.downloadWithProgress(fileUrl, fileName);
      }
    });
  }

  /**
   * Download file with progress tracking
   * @param {string} url - File URL
   * @param {string} filename - File name
   */
  async downloadWithProgress(url, filename) {
    try {
      // Show progress notification
      this.notificationManager.show(`⚡ Downloading ${filename}...`, 0, true);
      this.notificationManager.updateProgress(0);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      
      if (!contentLength || isNaN(total)) {
        // No content length, just download normally
        const blob = await response.blob();
        this.triggerDownload(blob, filename);
        this.notificationManager.show(`✓ ${filename} downloaded!`, 3000);
        return;
      }
      
      // Read response with progress
      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];
      let lastUpdate = Date.now();
      
      while (true) {
        const {done, value} = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress (throttle updates to every 100ms)
        const now = Date.now();
        if (now - lastUpdate > 100) {
          const progress = Math.round((receivedLength / total) * 100);
          this.notificationManager.updateProgress(progress);
          this.notificationManager.show(`⚡ Downloading ${filename}... ${progress}%`, 0, true);
          lastUpdate = now;
        }
      }
      
      // Final progress update
      this.notificationManager.updateProgress(100);
      
      // Combine chunks and trigger download
      const blob = new Blob(chunks);
      this.triggerDownload(blob, filename);
      
      // Show success notification
      this.notificationManager.show(`✓ ${filename} downloaded successfully!`, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      this.notificationManager.show(`❌ Download failed: ${error.message}`, 5000);
    }
  }

  /**
   * Trigger browser download
   * @param {Blob} blob - File blob
   * @param {string} filename - File name
   */
  triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Load downloads from the downloads folder
   * Tries multiple methods: PHP API, directory listing
   */
  async loadDownloads() {
    console.log('🔍 AI Adaptive Sensing: Scanning downloads folder...');
    
    // Method 1: Try enhanced PHP API
    try {
      const response = await fetch(this.apiFolder + 'list-files.php');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (data.files && data.files.length > 0) {
            console.log(`✓ PHP API: Found ${data.files.length} files`);
            if (data.server) {
              console.log(`✓ Server: PHP ${data.server.php_version}`);
            }
            await this.renderDownloads(data.files);
            return;
          } else {
            console.log('ℹ️  PHP API: No downloadable files found');
            await this.renderDownloads([]);
            return;
          }
        }
      }
    } catch (error) {
      console.log('⚠️  PHP API not available:', error.message);
    }

    // Method 2: Try directory listing (Apache/Nginx with autoindex)
    try {
      const response = await fetch(this.downloadsFolder);
      
      if (response.ok) {
        const html = await response.text();
        const files = this.parseDirectoryListing(html);
        
        if (files.length > 0) {
          console.log(`✓ Directory Listing: Found ${files.length} files`);
          await this.renderDownloads(files);
          return;
        } else {
          console.log('ℹ️  Directory Listing: No downloadable files found');
          await this.renderDownloads([]);
          return;
        }
      }
    } catch (error) {
      console.log('⚠️  Directory listing not available:', error.message);
    }

    // Method 3: Fallback - show empty state
    console.log('ℹ️  No detection method available, showing empty state');
    await this.renderDownloads([]);
  }

  /**
   * Parse directory listing HTML to extract file names
   * @param {string} html - Directory listing HTML
   * @returns {Array} - Array of file objects
   */
  parseDirectoryListing(html) {
    const files = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href !== '../' && !href.startsWith('/') && !href.startsWith('?')) {
        const fileName = href.replace(/\/$/, '');
        if (fileName && fileName !== '.' && fileName !== '..') {
          files.push({
            name: fileName,
            path: this.downloadsFolder + fileName
          });
        }
      }
    });

    return files;
  }

  /**
   * Render downloads from predefined metadata
   */
  async renderPredefinedDownloads() {
    const files = Object.keys(this.fileMetadata).map(fileName => ({
      name: fileName,
      path: this.downloadsFolder + fileName,
      metadata: this.fileMetadata[fileName]
    }));

    await this.renderDownloads(files);
  }

  /**
   * Render download cards for all files
   * @param {Array} files - Array of file objects
   */
  async renderDownloads(files) {
    // Clear loading indicator
    this.downloadsGrid.innerHTML = '';

    if (files.length === 0) {
      this.downloadsGrid.innerHTML = `
        <div class="no-downloads">
          <span class="no-downloads-icon">📭</span>
          <p class="no-downloads-text">No downloads available yet. Check back soon!</p>
        </div>
      `;
      return;
    }

    console.log(`✓ Rendering ${files.length} download cards`);

    // Create download card for each file
    files.forEach(file => {
      const card = this.createDownloadCard(file);
      this.downloadsGrid.appendChild(card);
    });
  }

  /**
   * Create a download card element
   * @param {Object} file - File object with name, path, and optional metadata
   * @returns {HTMLElement} - Download card element
   */
  createDownloadCard(file) {
    const card = document.createElement('div');
    card.className = 'download-card glow-box';

    const extension = this.getFileExtension(file.name);
    const icon = this.fileIcons[extension] || this.fileIcons['default'];
    const metadata = file.metadata || this.generateMetadata(file.name);
    const fileSize = file.sizeFormatted || this.formatFileSize(file.size);

    card.innerHTML = `
      <div class="download-icon">${icon}</div>
      <h3>${metadata.title}</h3>
      <p class="download-description">${metadata.description}</p>
      <div class="download-meta">
        <span class="file-type">${extension.toUpperCase()}</span>
        ${fileSize ? `<span class="file-size">${fileSize}</span>` : ''}
      </div>
      <a href="${file.path}" 
         download="${file.name}" 
         class="download-button glow-box"
         data-filename="${file.name}">
        <span class="download-icon-btn">⚡</span>
        <span>Super Speed Download</span>
      </a>
    `;

    return card;
  }

  /**
   * Get file extension from filename
   * @param {string} filename - File name
   * @returns {string} - File extension
   */
  getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Generate metadata for a file based on its name (AI adaptive)
   * @param {string} filename - File name
   * @returns {Object} - Metadata object
   */
  generateMetadata(filename) {
    // Remove extension and convert to title case
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const extension = this.getFileExtension(filename);
    
    // Smart title generation
    const title = nameWithoutExt
      .split(/[-_.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // AI-based description generation based on filename patterns
    let description = '';
    let category = 'Resource';

    const lowerName = filename.toLowerCase();

    // Pattern matching for intelligent descriptions
    if (lowerName.includes('hyperbreach') || lowerName.includes('breach')) {
      description = 'HyperBreach platform package with advanced offensive security testing capabilities and multi-protocol support.';
      category = 'Security Tool';
    } else if (lowerName.includes('worlds') && lowerName.includes('first')) {
      description = 'Revolutionary breakthrough documentation on world\'s first auto-dissolution technology for security operations.';
      category = 'Documentation';
    } else if (lowerName.includes('dissolution') || lowerName.includes('auto-dissolve')) {
      description = 'Auto-dissolution technology package with autonomous self-destruction and trace elimination features.';
      category = 'Security Tool';
    } else if (lowerName.includes('whitepaper') || lowerName.includes('paper')) {
      description = 'Technical whitepaper detailing architecture, implementation, and security research findings.';
      category = 'Documentation';
    } else if (lowerName.includes('guide') || lowerName.includes('manual') || lowerName.includes('doc')) {
      description = 'Comprehensive technical guide with implementation details and usage instructions.';
      category = 'Documentation';
    } else if (lowerName.includes('tool') || lowerName.includes('exploit') || lowerName.includes('payload')) {
      description = 'Offensive security tool for authorized penetration testing and security assessments.';
      category = 'Security Tool';
    } else if (lowerName.includes('research') || lowerName.includes('analysis')) {
      description = 'Security research materials and analysis documentation for advanced threat modeling.';
      category = 'Research';
    } else if (extension === 'zip' || extension === 'tar' || extension === 'gz' || extension === '7z') {
      description = 'Compressed archive containing security tools, documentation, or research materials.';
      category = 'Archive';
    } else if (extension === 'bin' || extension === 'exe' || extension === 'sh') {
      description = 'Executable binary for offensive security testing and authorized penetration testing operations.';
      category = 'Binary';
    } else if (extension === 'pdf') {
      description = 'Technical documentation and research materials for security professionals.';
      category = 'Documentation';
    } else if (extension === 'md' || extension === 'markdown') {
      description = 'Technical documentation in markdown format with detailed information and specifications.';
      category = 'Documentation';
    } else {
      description = `Download ${title} for HyperSecurity Offensive Labs security research and testing.`;
      category = 'Resource';
    }

    return {
      title: title,
      description: description,
      category: category
    };
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * Add a new file to the downloads
   * @param {Object} file - File object with name, path, metadata
   */
  addFile(file) {
    if (!this.downloadsGrid) return;

    const card = this.createDownloadCard(file);
    this.downloadsGrid.appendChild(card);

    // Trigger animation
    setTimeout(() => {
      card.classList.add('fade-in-up');
    }, 10);
  }

  /**
   * Remove a file from the downloads
   * @param {string} filename - Name of the file to remove
   */
  removeFile(filename) {
    if (!this.downloadsGrid) return;

    const cards = this.downloadsGrid.querySelectorAll('.download-card');
    cards.forEach(card => {
      const downloadLink = card.querySelector('.download-button');
      if (downloadLink && downloadLink.getAttribute('download') === filename) {
        card.classList.add('fade-out');
        setTimeout(() => {
          card.remove();
        }, 300);
      }
    });
  }
}

// Initialize downloads manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const downloadsManager = new DownloadsManager();
  downloadsManager.init();
  
  // Make it globally accessible for manual file management
  window.downloadsManager = downloadsManager;
  
  console.log('HyperSecurity Offensive Labs - Downloads Manager loaded');
});
