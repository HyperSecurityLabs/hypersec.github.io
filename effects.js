// HyperSecurity Offensive Labs - Visual Effects
// Cyberpunk visual effects, glow animations, and parallax

/**
 * Glitch Effect for Hero Text
 * Creates random text displacement and RGB color separation effect
 */
class GlitchEffect {
  constructor(element, options = {}) {
    this.element = element;
    this.originalText = element.textContent;
    this.isGlitching = false;
    
    // Configuration
    this.config = {
      interval: options.interval || 3000,
      duration: options.duration || 500,
      intensity: options.intensity || 5,
      rgbOffset: options.rgbOffset || 3,
      ...options
    };
    
    // Start automatic glitching
    if (this.config.autoStart !== false) {
      this.startAutoGlitch();
    }
  }
  
  /**
   * Apply glitch effect once
   */
  glitch() {
    if (this.isGlitching) return;
    
    this.isGlitching = true;
    const originalText = this.element.textContent;
    const glitchCount = Math.floor(Math.random() * 3) + 2; // 2-4 glitches
    let glitchIndex = 0;
    
    const glitchInterval = setInterval(() => {
      if (glitchIndex >= glitchCount) {
        clearInterval(glitchInterval);
        this.element.textContent = originalText;
        this.element.style.textShadow = '';
        this.isGlitching = false;
        return;
      }
      
      // Random text displacement
      const chars = originalText.split('');
      const glitchedText = chars.map((char) => {
        if (Math.random() < 0.1) {
          const randomChar = String.fromCharCode(33 + Math.floor(Math.random() * 94));
          return randomChar;
        }
        return char;
      }).join('');
      
      this.element.textContent = glitchedText;
      
      // RGB color separation effect
      const offsetX = (Math.random() - 0.5) * this.config.rgbOffset * 2;
      const offsetY = (Math.random() - 0.5) * this.config.rgbOffset * 2;
      
      this.element.style.textShadow = `
        ${offsetX}px ${offsetY}px 0 rgba(255, 0, 0, 0.8),
        ${-offsetX}px ${-offsetY}px 0 rgba(0, 255, 255, 0.8),
        0 0 10px rgba(255, 0, 0, 0.8),
        0 0 20px rgba(255, 0, 0, 0.6),
        0 0 30px rgba(255, 0, 0, 0.4)
      `;
      
      glitchIndex++;
    }, this.config.duration / glitchCount);
  }
  
  /**
   * Start automatic glitching at intervals
   */
  startAutoGlitch() {
    // Initial glitch on page load
    setTimeout(() => this.glitch(), 500);
    
    // Periodic glitching
    this.intervalId = setInterval(() => {
      this.glitch();
    }, this.config.interval);
  }
  
  /**
   * Stop automatic glitching
   */
  stopAutoGlitch() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Destroy the glitch effect
   */
  destroy() {
    this.stopAutoGlitch();
    this.element.textContent = this.originalText;
    this.element.style.textShadow = '';
  }
}


/**
 * Glow Pulse Animation
 * Creates dynamic glow intensity variation synchronized across elements
 */
class GlowPulse {
  constructor(elements, options = {}) {
    this.elements = Array.isArray(elements) ? elements : [elements];
    this.isAnimating = false;
    
    // Configuration
    this.config = {
      minIntensity: options.minIntensity || 10,
      maxIntensity: options.maxIntensity || 40,
      duration: options.duration || 2000,
      easing: options.easing || 'ease-in-out',
      color: options.color || 'rgba(255, 0, 0, 0.8)',
      synchronized: options.synchronized !== false,
      ...options
    };
    
    // Start animation
    if (this.config.autoStart !== false) {
      this.start();
    }
  }
  
  /**
   * Start the glow pulse animation
   */
  start() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.elements.forEach((element, index) => {
      const delay = this.config.synchronized ? 0 : index * 200;
      this.animateElement(element, delay);
    });
  }
  
  /**
   * Animate a single element
   */
  animateElement(element, delay = 0) {
    if (!this.isAnimating) return;
    
    // Add will-change for performance optimization
    element.style.willChange = 'text-shadow, box-shadow';
    
    setTimeout(() => {
      if (!this.isAnimating) return;
      
      const startTime = performance.now();
      const animate = (currentTime) => {
        if (!this.isAnimating) {
          // Clean up will-change when animation stops
          element.style.willChange = 'auto';
          return;
        }
        
        const elapsed = currentTime - startTime;
        const progress = (elapsed % this.config.duration) / this.config.duration;
        
        // Sine wave for smooth pulsing
        const intensity = this.config.minIntensity + 
          (this.config.maxIntensity - this.config.minIntensity) * 
          (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);
        
        // Apply glow effect
        if (element.classList.contains('glow-red') || element.classList.contains('glow-box')) {
          const isText = element.classList.contains('glow-red');
          
          if (isText) {
            element.style.textShadow = `
              0 0 ${intensity * 0.5}px ${this.config.color},
              0 0 ${intensity}px ${this.config.color},
              0 0 ${intensity * 1.5}px ${this.config.color},
              0 0 ${intensity * 2}px rgba(255, 0, 0, 0.6)
            `;
          } else {
            element.style.boxShadow = `
              0 0 ${intensity * 0.5}px ${this.config.color},
              0 0 ${intensity}px ${this.config.color},
              0 0 ${intensity * 1.5}px rgba(255, 0, 0, 0.5)
            `;
          }
        }
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }, delay);
  }
  
  /**
   * Stop the glow pulse animation
   */
  stop() {
    this.isAnimating = false;
    
    // Reset to default glow and clean up will-change
    this.elements.forEach(element => {
      element.style.textShadow = '';
      element.style.boxShadow = '';
      element.style.willChange = 'auto';
    });
  }
  
  /**
   * Destroy the glow pulse effect
   */
  destroy() {
    this.stop();
  }
}


/**
 * Parallax Scrolling Effect
 * Creates depth illusion by moving background layers at different speeds
 */
class ParallaxEffect {
  constructor(elements, options = {}) {
    this.elements = Array.isArray(elements) ? elements : [elements];
    this.isActive = false;
    
    // Configuration
    this.config = {
      speed: options.speed || 0.5, // Multiplier for scroll speed (0-1)
      direction: options.direction || 'vertical', // 'vertical' or 'horizontal'
      ...options
    };
    
    // Bind scroll handler
    this.handleScroll = this.handleScroll.bind(this);
    
    // Start parallax
    if (this.config.autoStart !== false) {
      this.start();
    }
  }
  
  /**
   * Start the parallax effect
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // Initial position
    this.handleScroll();
  }
  
  /**
   * Handle scroll event
   */
  handleScroll() {
    if (!this.isActive) return;
    
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.elements.forEach(element => {
      // Get element-specific speed if set via data attribute
      const speed = parseFloat(element.dataset.parallaxSpeed) || this.config.speed;
      
      // Calculate parallax offset
      const offset = scrollY * speed;
      
      // Add will-change for performance
      element.style.willChange = 'transform';
      
      // Apply transform for performance (using translate3d for GPU acceleration)
      if (this.config.direction === 'vertical') {
        element.style.transform = `translate3d(0, ${offset}px, 0)`;
      } else {
        element.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
    });
  }
  
  /**
   * Stop the parallax effect
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    window.removeEventListener('scroll', this.handleScroll);
    
    // Reset transforms and clean up will-change
    this.elements.forEach(element => {
      element.style.transform = '';
      element.style.willChange = 'auto';
    });
  }
  
  /**
   * Update parallax speed
   */
  setSpeed(speed) {
    this.config.speed = speed;
  }
  
  /**
   * Destroy the parallax effect
   */
  destroy() {
    this.stop();
  }
}

/**
 * Initialize all visual effects on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize glitch effect on hero title
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const glitchEffect = new GlitchEffect(heroTitle, {
      interval: 4000,
      duration: 400,
      intensity: 5,
      rgbOffset: 3
    });
    
    // Store reference for potential cleanup
    window.heroGlitchEffect = glitchEffect;
  }
  
  // Initialize glow pulse on all glow elements
  const glowElements = document.querySelectorAll('.glow-red, .glow-box');
  if (glowElements.length > 0) {
    const glowPulse = new GlowPulse(Array.from(glowElements), {
      minIntensity: 10,
      maxIntensity: 30,
      duration: 2000,
      synchronized: false
    });
    
    // Store reference for potential cleanup
    window.glowPulseEffect = glowPulse;
  }
  
  // Initialize parallax effect on hero section
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    // Create parallax background layer if it doesn't exist
    let parallaxLayer = heroSection.querySelector('.parallax-bg');
    if (!parallaxLayer) {
      parallaxLayer = document.createElement('div');
      parallaxLayer.className = 'parallax-bg';
      parallaxLayer.style.position = 'absolute';
      parallaxLayer.style.top = '-20%';
      parallaxLayer.style.left = '0';
      parallaxLayer.style.width = '100%';
      parallaxLayer.style.height = '120%';
      parallaxLayer.style.zIndex = '-1';
      parallaxLayer.style.opacity = '0.3';
      parallaxLayer.style.pointerEvents = 'none';
      
      // Add grid pattern
      parallaxLayer.style.backgroundImage = `
        linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px)
      `;
      parallaxLayer.style.backgroundSize = '50px 50px';
      
      heroSection.insertBefore(parallaxLayer, heroSection.firstChild);
    }
    
    const parallaxEffect = new ParallaxEffect(parallaxLayer, {
      speed: -0.3,
      direction: 'vertical'
    });
    
    // Store reference for potential cleanup
    window.parallaxEffect = parallaxEffect;
  }
  
  console.log('HyperSecurity Offensive Labs - Visual Effects initialized');
});
