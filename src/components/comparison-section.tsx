"use client"

import { useRef, useEffect } from 'react';
import Image from 'next/image';

export function ComparisonSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const withoutSideRef = useRef<HTMLDivElement>(null);
  const withSideRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    const sliderContainer = sliderContainerRef.current;
    const withoutSide = withoutSideRef.current;
    const withSide = withSideRef.current;
    
    if (!container || !sliderContainer || !withoutSide || !withSide) return;
    
    let isDragging = false;
    
    // Set initial position
    updateSliderPosition(50);
    
    // Handle slider drag
    const startDrag = (e: MouseEvent | TouchEvent) => {
      e.preventDefault && e.preventDefault();
      isDragging = true;
    };
    
    const endDrag = () => {
      isDragging = false;
    };
    
    const drag = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      e.preventDefault && e.preventDefault();
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Get X position for both mouse and touch events
      const clientX = 'clientX' in e ? e.clientX : (e.touches && e.touches[0].clientX);
      
      if (clientX) {
        const position = ((clientX - containerRect.left) / containerWidth) * 100;
        updateSliderPosition(Math.max(0, Math.min(100, position)));
      }
    };
    
    function updateSliderPosition(position: number) {
      // Update slider position
      if (sliderContainer) {
        sliderContainer.style.left = `${position}%`;
      }
      
      // Update content visibility
      if (withoutSide) {
        withoutSide.style.clip = `rect(0, ${position}vw, 100vh, 0)`;
      }
      
      if (withSide) {
        withSide.style.clip = `rect(0, 100vw, 100vh, ${position}vw)`;
      }
    }
    
    // Add event listeners
    sliderContainer.addEventListener('mousedown', startDrag);
    sliderContainer.addEventListener('touchstart', startDrag, { passive: false });
    
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
    
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    
    // Update on window resize
    const handleResize = () => {
      const sliderPosition = (sliderContainer.offsetLeft / container.offsetWidth) * 100;
      updateSliderPosition(sliderPosition);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      sliderContainer.removeEventListener('mousedown', startDrag);
      sliderContainer.removeEventListener('touchstart', startDrag);
      
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('touchmove', drag);
      
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <section className="w-full pb-0">
      <h2 className="text-6xl font-bold text-center mb-12 tracking-tighter">Discover the Substackulous Difference</h2>
      
      <div 
        ref={containerRef}
        className="relative w-full h-[800px] overflow-hidden"
        style={{ 
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        }}
      >
        <div 
          ref={withoutSideRef}
          className="side without-side absolute w-full h-full flex flex-col items-center justify-center p-8 text-white"
          style={{ 
            background: 'linear-gradient(to right,#db55a1 10%, #db55a1,#c18e37,#c18e37 90%)',
            left: 0,
            zIndex: 1 
          }}
        >
          {/* Diagonal "WITHOUT SUBSTACKULOUS" text on left side */}
          <div className="absolute top-[10%] left-[5%] z-[5] transform rotate-[-30deg]">
            <div className="text-black text-4xl font-light">WITHOUT</div>
            <div className="relative">
              <div className="absolute -inset-1 bg-white transform skew-x-[-15deg]"></div>
              <div className="text-black text-4xl font-bold relative">SUBSTACKULOUS</div>
            </div>
          </div>
          
          <div className="content max-w-[1300px] text-center">
            <div className="content-container flex justify-between items-center w-full">
              <div className="list-column w-[calc(50%-120px)]">
                <ul className="list-none text-left text-base">
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Spend hours staring at a blank page, unsure what to write
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Create content that gets ignored and fails to connect
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Struggle to grow beyond your first 100 subscribers
                  </li>
                </ul>
              </div>
              <div className="w-[600px] h-[600px] mx-[10px] relative overflow-hidden rounded">
                <Image 
                  src="/p5.png" 
                  alt="Without Substackulous" 
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority
                />
              </div>
              <div className="list-column w-[calc(50%-120px)]">
                <ul className="list-none text-left text-base">
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Feel overwhelmed by all the different tools you need
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Watch competitors succeed while you stay stuck
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-[#ff6b6b]">✖</span>
                    Waste money on multiple subscriptions for different tools
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={withSideRef}
          className="side with-side absolute w-full h-full flex flex-col items-center justify-center p-8 text-white"
          style={{ 
            background: 'linear-gradient(to right, #8b6be2 10%, #8b6be2, #027fc8, #027fc8 90%)',
            right: 0,
            zIndex: 1 
          }}
        >
          {/* Diagonal "WITH SUBSTACKULOUS" text on right side */}
          <div className="absolute top-[72%] right-[10%] z-[5] transform rotate-[-20deg]">
            <div className="text-black text-5xl font-light">WITH</div>
            <div className="relative">
              <div className="absolute -inset-1 bg-white transform skew-x-[-10deg]"></div>
              <div className="text-black text-5xl font-bold relative">SUBSTACKULOUS</div>
            </div>
          </div>
          
          <div className="content max-w-[1300px] text-center">
            <div className="content-container flex justify-between items-center w-full">
              <div className="list-column w-[calc(50%-120px)]">
                <ul className="list-none text-left text-base">
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Generate captivating content in minutes, not hours
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Create eye-catching thumbnails that drive clicks
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Build a growth engine that attracts subscribers daily
                  </li>
                </ul>
              </div>
              <div className="w-[600px] h-[600px] mx-[10px] relative overflow-hidden rounded">
                <Image 
                  src="/p6.png" 
                  alt="With Substackulous" 
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority
                />
              </div>
              <div className="list-column w-[calc(50%-120px)]">
                <ul className="list-none text-left text-base">
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Craft irresistible offers that convert readers into paying members
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Join the ranks of top-earning newsletter creators
                  </li>
                  <li className="mb-5 relative pl-8 leading-relaxed">
                    <span className="absolute left-0 text-lime-400 font-bold">✓</span>
                    Use one streamlined tool for your entire workflow
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={sliderContainerRef}
          className="slider-container absolute h-full w-[10px] top-0 left-1/2 -translate-x-1/2 z-[10] cursor-col-resize flex justify-center"
        >
          <div className="slider-line absolute h-full w-[4px] bg-white"></div>
          <div className="slider-handle absolute w-[50px] h-[50px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex justify-center items-center">
            <span className="slider-arrow text-2xl text-[#333] font-bold select-none">↔</span>
          </div>
        </div>
      </div>
    </section>
  );
} 