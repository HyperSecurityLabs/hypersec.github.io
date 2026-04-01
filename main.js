// HyperSecurity Offensive Labs - Main JavaScript
// Core functionality, scroll animations, and navigation

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounce function - delays execution until after a specified wait time
 * has elapsed since the last time it was invoked
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures a function is called at most once per specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to wait between calls
 * @returns {Function} - The throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if an element is visible in the viewport
 * @param {HTMLElement} element - The element to check
 * @param {number} threshold - Percentage of element that must be visible (0-1)
 * @returns {boolean} - True if element is visible
 */
function isElementVisible(element, threshold = 0) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // Calculate visible height and width
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  
  // Calculate element dimensions
  const elementHeight = rect.height;
  const elementWidth = rect.width;
  
  // Check if element meets threshold
  const heightThreshold = elementHeight * threshold;
  const widthThreshold = elementWidth * threshold;
  
  return visibleHeight >= heightThreshold && 
         visibleWidth >= widthThreshold &&
         visibleHeight > 0 && 
         visibleWidth > 0;
}

// ============================================================================
// Smooth Scrolling Navigation
// ============================================================================

/**
 * Initialize smooth scrolling for navigation links
 * Cross-browser compatible implementation
 */
function initSmoothScrolling() {
  // Get all navigation links that point to sections
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Get the target section ID from href
      const targetId = link.getAttribute('href');
      
      // Skip if it's just "#" or empty
      if (!targetId || targetId === '#') return;
      
      // Find the target element
      const targetElement = document.querySelector(targetId);
      
      // If target exists, prevent default and smooth scroll
      if (targetElement) {
        e.preventDefault();
        
        // Check if browser supports smooth scrolling
        if ('scrollBehavior' in document.documentElement.style) {
          // Native smooth scroll
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Fallback for browsers without smooth scroll support (IE, older Safari)
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const startPosition = window.pageYOffset;
          const distance = targetPosition - startPosition;
          const duration = 800;
          let start = null;
          
          function smoothScrollStep(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            
            // Easing function for smooth animation
            const easing = percentage < 0.5
              ? 2 * percentage * percentage
              : -1 + (4 - 2 * percentage) * percentage;
            
            window.scrollTo(0, startPosition + distance * easing);
            
            if (progress < duration) {
              window.requestAnimationFrame(smoothScrollStep);
            }
          }
          
          window.requestAnimationFrame(smoothScrollStep);
        }
        
        // Update browser history
        if (history.pushState) {
          history.pushState(null, null, targetId);
        } else {
          // Fallback for older browsers
          window.location.hash = targetId;
        }
      }
    });
  });
}

// ============================================================================
// Active Section Highlighting
// ============================================================================

/**
 * Track current viewport section and update navigation active state
 * Uses Intersection Observer API with fallback for older browsers
 */
function initActiveSectionHighlighting() {
  // Get all sections that have IDs
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, using fallback');
    // Fallback: use scroll event listener
    initActiveSectionFallback(sections, navLinks);
    return;
  }
  
  // Options for Intersection Observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-20% 0px -70% 0px', // Trigger when section is in middle of viewport
    threshold: 0
  };
  
  // Track which section is currently active
  let currentActiveSection = null;
  
  // Callback function for Intersection Observer
  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute('id');
        
        // Update active state if this is a new section
        if (currentActiveSection !== sectionId) {
          currentActiveSection = sectionId;
          updateActiveNavLink(sectionId);
        }
      }
    });
  };
  
  // Create Intersection Observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);
  
  // Observe all sections
  sections.forEach(section => {
    observer.observe(section);
  });
  
  /**
   * Update navigation active state for the current section
   * @param {string} sectionId - ID of the active section
   */
  function updateActiveNavLink(sectionId) {
    // Remove active class from all nav links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to the link that matches the current section
    const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }
  
  // Set initial active state based on current scroll position or hash
  const initialHash = window.location.hash;
  if (initialHash) {
    const initialSectionId = initialHash.substring(1); // Remove the '#'
    updateActiveNavLink(initialSectionId);
  } else {
    // Default to first section (hero)
    if (sections.length > 0) {
      const firstSectionId = sections[0].getAttribute('id');
      updateActiveNavLink(firstSectionId);
    }
  }
}

/**
 * Fallback for browsers without Intersection Observer support
 * @param {NodeList} sections - All sections with IDs
 * @param {NodeList} navLinks - All navigation links
 */
function initActiveSectionFallback(sections, navLinks) {
  const updateActiveSection = throttle(() => {
    const scrollPosition = window.pageYOffset + window.innerHeight / 2;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, 100);
  
  window.addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection(); // Initial call
}

/**
 * Fallback for browsers without Intersection Observer support
 * @param {NodeList} sections - All sections with IDs
 * @param {NodeList} navLinks - All navigation links
 */
function initActiveSectionFallback(sections, navLinks) {
  const updateActiveSection = throttle(() => {
    const scrollPosition = window.pageYOffset + window.innerHeight / 2;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, 100);
  
  window.addEventListener('scroll', updateActiveSection, { passive: true });
  updateActiveSection(); // Initial call
}

// ============================================================================
// Mobile Menu Toggle
// ============================================================================

/**
 * Initialize mobile menu toggle functionality
 */
function initMobileMenuToggle() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const body = document.body;
  
  if (!navToggle || !navMenu) {
    console.warn('Mobile menu elements not found');
    return;
  }
  
  /**
   * Toggle mobile menu visibility
   */
  function toggleMenu() {
    const isActive = navMenu.classList.contains('active');
    
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  
  /**
   * Open mobile menu
   */
  function openMenu() {
    navMenu.classList.add('active');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
  }
  
  /**
   * Close mobile menu
   */
  function closeMenu() {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = ''; // Restore body scroll
  }
  
  // Toggle menu when hamburger button is clicked
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling to document
    toggleMenu();
  });
  
  // Close menu when navigation link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const isMenuActive = navMenu.classList.contains('active');
    const isClickInsideMenu = navMenu.contains(e.target);
    const isClickOnToggle = navToggle.contains(e.target);
    
    // Close menu if it's open and click is outside menu and toggle button
    if (isMenuActive && !isClickInsideMenu && !isClickOnToggle) {
      closeMenu();
    }
  });
  
  // Close menu on escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });
  
  // Close menu when window is resized to desktop size
  window.addEventListener('resize', () => {
    if (window.innerWidth > 767 && navMenu.classList.contains('active')) {
      closeMenu();
    }
  });
}

// ============================================================================
// Scroll Animations
// ============================================================================

/**
 * Initialize scroll animations using Intersection Observer
 * Animates elements when they enter the viewport
 * Includes fallback for browsers without Intersection Observer support
 */
function initScrollAnimations() {
  // Select all elements that should be animated on scroll
  const animatedElements = document.querySelectorAll(
    '.about-section, .auto-dissolution-section, .hyperbreach-section, .contact-section, ' +
    '.feature-card, .tech-feature, .innovation-item, .platform-feature, ' +
    '.protocol-category, .spec-item, .contact-link'
  );
  
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported for scroll animations, using fallback');
    // Fallback: animate all elements immediately with fade-in
    animatedElements.forEach(element => {
      element.style.opacity = '1';
      element.classList.add('fade-in');
    });
    return null;
  }
  
  // Configuration for Intersection Observer
  const observerOptions = {
    root: null, // Use viewport as root
    rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport
    threshold: 0.1 // Trigger when 10% of element is visible
  };
  
  /**
   * Callback function for Intersection Observer
   * @param {IntersectionObserverEntry[]} entries - Array of observed elements
   * @param {IntersectionObserver} observer - The observer instance
   */
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      // Check if element is intersecting with viewport
      if (entry.isIntersecting) {
        // Add animation class to trigger animation
        addAnimationClass(entry.target);
        
        // Stop observing this element (animation should only trigger once)
        observer.unobserve(entry.target);
      }
    });
  };
  
  /**
   * Add appropriate animation class to element based on its type
   * @param {HTMLElement} element - The element to animate
   */
  function addAnimationClass(element) {
    // Check if element already has an animation class
    if (element.dataset.animated === 'true') {
      return;
    }
    
    // Determine animation type based on element class or type
    let animationClass = 'fade-in-up'; // Default animation
    
    // Sections get fade-in-up animation
    if (element.tagName === 'SECTION') {
      animationClass = 'fade-in-up';
    }
    // Feature cards alternate between slide-in-left and slide-in-right
    else if (element.classList.contains('feature-card') || 
             element.classList.contains('tech-feature') ||
             element.classList.contains('platform-feature')) {
      const index = Array.from(element.parentElement.children).indexOf(element);
      animationClass = index % 2 === 0 ? 'slide-in-left' : 'slide-in-right';
    }
    // Protocol categories slide in from left
    else if (element.classList.contains('protocol-category')) {
      animationClass = 'slide-in-left';
    }
    // Innovation items fade in
    else if (element.classList.contains('innovation-item')) {
      animationClass = 'fade-in-up';
    }
    // Contact links slide in from bottom
    else if (element.classList.contains('contact-link')) {
      animationClass = 'slide-in-up';
    }
    // Spec items fade in
    else if (element.classList.contains('spec-item')) {
      animationClass = 'fade-in';
    }
    
    // Add animation class and mark as animated
    element.classList.add(animationClass);
    element.dataset.animated = 'true';
    
    // Clean up will-change after animation completes
    element.addEventListener('animationend', () => {
      element.style.willChange = 'auto';
    }, { once: true });
  }
  
  // Create Intersection Observer instance
  const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
  
  // Observe all animated elements
  animatedElements.forEach(element => {
    // Set initial state - elements start invisible
    element.style.opacity = '0';
    
    // Observe the element
    scrollObserver.observe(element);
  });
  
  // Return observer instance for potential cleanup
  return scrollObserver;
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScrolling();
  initActiveSectionHighlighting();
  initMobileMenuToggle();
  initScrollAnimations();
  console.log('HyperSecurity Offensive Labs - Main JS loaded');
});
