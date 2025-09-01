'use client';

import { useEffect, useRef } from 'react';



export const HeroAnimations = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current || typeof window === 'undefined') return;

    // Load anime.js dynamically
    import('animejs').then((module) => {
      const anime = (module as any).default || module;
      
      // Animate the hero title with more dramatic entrance
      anime({
        targets: '.hero-title',
        opacity: [0, 1],
        translateY: [100, 0],
        scale: [0.8, 1],
        duration: 1500,
        easing: 'easeOutElastic(1, 0.5)',
        delay: 200
      });

      // Animate the subtitle with staggered text effect
      anime({
        targets: '.hero-subtitle',
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1200,
        easing: 'easeOutCubic',
        delay: 800
      });

      // Animate the CTA button with bounce effect
      anime({
        targets: '.hero-cta',
        opacity: [0, 1],
        scale: [0.5, 1.1, 1],
        translateY: [30, 0],
        duration: 1000,
        easing: 'easeOutBack',
        delay: 1200
      });

      // Enhanced floating geometric shapes animation
      anime({
        targets: '.floating-shape',
        translateY: [0, -40, 0],
        translateX: [0, 20, 0],
        rotate: [0, 360],
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.8, 0.3],
        duration: 6000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
        delay: anime.stagger(300)
      });
    });

  }, []);

  return (
    <div ref={heroRef} className="relative overflow-hidden">
      {/* Enhanced floating geometric shapes */}
      <div className="floating-shape absolute top-20 left-10 w-6 h-6 bg-gradient-to-r from-blue-400/40 to-cyan-400/40 rounded-full shadow-lg"></div>
      <div className="floating-shape absolute top-40 right-20 w-8 h-8 bg-gradient-to-r from-purple-400/40 to-pink-400/40 rounded-lg rotate-45 shadow-lg"></div>
      <div className="floating-shape absolute bottom-20 left-1/4 w-5 h-5 bg-gradient-to-r from-green-400/40 to-emerald-400/40 rounded-full shadow-lg"></div>
      <div className="floating-shape absolute top-1/2 right-1/3 w-7 h-7 bg-gradient-to-r from-pink-400/40 to-rose-400/40 rounded-lg shadow-lg"></div>
      <div className="floating-shape absolute top-1/3 left-1/3 w-4 h-4 bg-gradient-to-r from-yellow-400/40 to-orange-400/40 rounded-full shadow-lg"></div>
      <div className="floating-shape absolute bottom-1/3 right-1/4 w-6 h-6 bg-gradient-to-r from-indigo-400/40 to-blue-400/40 rounded-lg shadow-lg"></div>
    </div>
  );
};

export const FeatureCardAnimations = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load anime.js dynamically
    import('animejs').then((module) => {
      const anime = (module as any).default || module;
      
      // Animate feature cards on scroll
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
                      anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [80, 0],
            scale: [0.9, 1],
            rotateX: [15, 0],
            duration: 1000,
            easing: 'easeOutBack'
          });
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.feature-card').forEach((card) => {
        observer.observe(card);
      });

      return () => observer.disconnect();
    });
  }, []);

  return null;
};

export const MouseTrailEffect = () => {
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let trail: HTMLElement[] = [];

    // Create trail elements
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('div');
      dot.className = 'fixed w-2 h-2 bg-blue-400/30 rounded-full pointer-events-none z-50';
      dot.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(dot);
      trail.push(dot);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateTrail = () => {
      let x = mouseX;
      let y = mouseY;

      trail.forEach((dot, index) => {
        const nextDot = trail[index + 1] || trail[0];
        
        x += (nextDot.offsetLeft - x) * 0.3;
        y += (nextDot.offsetTop - y) * 0.3;

        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
      });

      requestAnimationFrame(animateTrail);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animateTrail();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      trail.forEach(dot => dot.remove());
    };
  }, []);

  return null;
};

export const CounterAnimation = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!counterRef.current || typeof window === 'undefined') return;

    // Load anime.js dynamically
    import('animejs').then((module) => {
      const anime = (module as any).default || module;
      
      anime({
        targets: counterRef.current,
        innerHTML: [0, value],
        duration: duration,
        easing: 'easeOutCubic',
        round: 1,
        update: function(anim: any) {
          counterRef.current!.innerHTML = anim.animations[0].currentValue.toFixed(0);
        }
      });
    });
  }, [value, duration]);

  return <span ref={counterRef}>0</span>;
};

export const FileUploadAnimation = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load anime.js dynamically
    import('animejs').then((module) => {
      const anime = (module as any).default || module;
      
      // Animate file upload area on hover
      const uploadArea = document.querySelector('.file-upload-area');
      if (!uploadArea) return;

      const handleMouseEnter = () => {
        anime({
          targets: '.file-upload-area',
          scale: [1, 1.05],
          translateY: [-5, 0],
          borderColor: ['#374151', '#3B82F6'],
          boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 20px rgba(59, 130, 246, 0.3)'],
          duration: 400,
          easing: 'easeOutBack'
        });
      };

      const handleMouseLeave = () => {
        anime({
          targets: '.file-upload-area',
          scale: [1.05, 1],
          translateY: [0, 0],
          borderColor: ['#3B82F6', '#374151'],
          boxShadow: ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 0 rgba(59, 130, 246, 0)'],
          duration: 400,
          easing: 'easeOutCubic'
        });
      };

      uploadArea.addEventListener('mouseenter', handleMouseEnter);
      uploadArea.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        uploadArea.removeEventListener('mouseenter', handleMouseEnter);
        uploadArea.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, []);

  return null;
};

export const ResultsAnimation = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load anime.js dynamically
    import('animejs').then((module) => {
      const anime = (module as any).default || module;
      
      // Animate results when they appear
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: '.result-card',
              opacity: [0, 1],
              translateX: [100, 0],
              scale: [0.8, 1],
              rotateY: [15, 0],
              duration: 800,
              easing: 'easeOutBack',
              delay: anime.stagger(150)
            });

            anime({
              targets: '.result-number',
              innerHTML: [0, (el: HTMLElement) => parseInt(el.getAttribute('data-value') || '0')],
              duration: 2000,
              easing: 'easeOutElastic(1, 0.5)',
              round: 1,
              delay: anime.stagger(300)
            });
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.results-section').forEach((section) => {
        observer.observe(section);
      });

      return () => observer.disconnect();
    });
  }, []);

  return null;
};
