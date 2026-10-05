'use client';
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import imagesLoaded from 'imagesloaded';
import { FaCar, FaBolt, FaShieldAlt } from 'react-icons/fa';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function StaggeredGrid({
  images = [],
  bentoItems = [],
  centerText = "PRIME FLEET",
  className = "",
  showFooter = false,
  scroller = null
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const gridFullRef = useRef(null);
  const textRef = useRef(null);
  const [activeBento, setActiveBento] = useState(0);

  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char inline-block" style={{ willChange: 'transform' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  useEffect(() => {
    const handleLoad = () => {
      document.body.classList.remove('loading');
      setIsLoaded(true);
    };

    const imgElements = document.querySelectorAll('.grid__item-img');
    let imgLoad;
    let fallbackTimer;

    if (imgElements.length > 0) {
      imgLoad = imagesLoaded(imgElements, { background: true }, handleLoad);
      fallbackTimer = setTimeout(handleLoad, 1800);
    } else {
      fallbackTimer = setTimeout(handleLoad, 0);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (imgLoad) imgLoad.off('always', handleLoad);
    };
  }, [images, bentoItems]);

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      if (textRef.current) {
        const chars = textRef.current.querySelectorAll('.char');
        gsap.timeline({
          scrollTrigger: {
            trigger: textRef.current,
            scroller: scroller || undefined,
            start: 'top bottom',
            end: 'center center-=25%',
            scrub: 1,
          }
        }).from(chars, {
          ease: 'sine.out',
          yPercent: 300,
          autoAlpha: 0,
          stagger: { each: 0.05, from: 'center' }
        });
      }

      if (gridFullRef.current) {
        const gridFullItems = gridFullRef.current.querySelectorAll('.grid__item');
        const numColumns = getComputedStyle(gridFullRef.current).getPropertyValue('grid-template-columns').split(' ').length || 7;
        const middleColumnIndex = Math.floor(numColumns / 2);

        const columns = Array.from({ length: numColumns }, () => []);
        gridFullItems.forEach((item) => {
          const colAttr = item.getAttribute('data-col');
          const columnIndex = colAttr !== null ? parseInt(colAttr, 10) : 0;
          if (columns[columnIndex]) {
            columns[columnIndex].push(item);
          }
        });

        columns.forEach((columnItems, columnIndex) => {
          const delayFactor = Math.abs(columnIndex - middleColumnIndex) * 0.2;

          gsap.timeline({
            scrollTrigger: {
              trigger: gridFullRef.current,
              scroller: scroller || undefined,
              start: 'top bottom',
              end: 'center center',
              scrub: 1.5,
            }
          })
          .from(columnItems, {
            yPercent: 450,
            autoAlpha: 0,
            delay: delayFactor,
            ease: 'sine.out',
          })
          .from(columnItems.map(item => item.querySelector('.grid__item-img')).filter(Boolean), {
            transformOrigin: '50% 0%',
            ease: 'sine.out',
          }, 0);
        });

        const bentoContainer = gridFullRef.current.querySelector('.bento-container');
        if (bentoContainer) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: gridFullRef.current,
              scroller: scroller || undefined,
              start: 'top top+=15%',
              end: 'bottom center',
              scrub: 1,
              invalidateOnRefresh: true,
            }
          });

          tl.to(bentoContainer, {
            y: window.innerHeight * 0.1,
            scale: 1.3,
            zIndex: 1000,
            ease: 'power2.out',
            duration: 1,
            force3D: true
          }, 0);
        }
      }
    });

    return () => ctx.revert();
  }, [isLoaded, scroller]);

  const defaultImages = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80'
  ];

  const effectiveImages = images && images.length > 0 ? images : defaultImages;
  const mixedGridItems = Array.from({ length: 21 }, (_, i) => effectiveImages[i % effectiveImages.length]);
  mixedGridItems[16] = 'BENTO_GROUP';

  return (
    <div className={`relative overflow-hidden w-full ${className}`}>
      <section className="grid place-items-center w-full relative mt-[8vh]">
        <div ref={textRef} className="text font-black uppercase flex content-center text-[clamp(2.5rem,10vw,7rem)] leading-none text-white tracking-widest">
          {splitText(centerText)}
        </div>
      </section>

      <section className="grid place-items-center w-full relative">
        <div ref={gridFullRef} className="grid--full relative w-full my-[6vh] h-auto aspect-[1.1] max-w-none p-4 grid gap-4 grid-cols-7 grid-rows-5">
          <div className="grid-overlay absolute inset-0 z-[15] pointer-events-none opacity-0 bg-black/80 rounded-lg transition-opacity duration-500" />
          {mixedGridItems.map((item, i) => {
            if (item === 'BENTO_GROUP') {
              if (!bentoItems || bentoItems.length === 0) return null;

              return (
                <div key="bento-group" data-col={2} className="grid__item bento-container col-span-3 row-span-1 relative z-20 flex items-center justify-center gap-3 h-full w-full will-change-transform">
                  {bentoItems.map((bentoItem, index) => {
                    const isActive = activeBento === index;
                    return (
                      <div
                        key={bentoItem.id || index}
                        className={`relative cursor-pointer overflow-hidden rounded-2xl h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                          isActive ? "bg-zinc-900 shadow-2xl border border-sky-500/50" : "bg-zinc-950 border border-zinc-800/60"
                        }`}
                        style={{ width: isActive ? "60%" : "20%" }}
                        onMouseEnter={() => setActiveBento(index)}
                        onClick={() => {
                          setActiveBento(index);
                          if (bentoItem.onClick) bentoItem.onClick();
                        }}
                      >
                        <div className="relative z-10 w-full h-full flex flex-col p-0">
                          <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-in-out ${
                            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                          }`}>
                            <div className="absolute inset-0 bg-zinc-900 overflow-hidden z-0">
                              {bentoItem.image && (
                                <>
                                  <img
                                    src={bentoItem.image}
                                    alt={bentoItem.title}
                                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                                  />
                                  <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
                                </>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-4 flex items-end justify-between z-20">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{bentoItem.subtitle}</span>
                                <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-md">{bentoItem.title}</h3>
                                {bentoItem.description && (
                                  <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">{bentoItem.description}</p>
                                )}
                              </div>
                              <div className="text-white drop-shadow-md">
                                {bentoItem.icon}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
                          isActive ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                        }`}>
                          <div className="text-zinc-400">
                            {bentoItem.icon}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center px-1 truncate w-full">
                            {bentoItem.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (i === 17 || i === 18) return null;

            if (typeof item === 'string') {
              const icons = [FaCar, FaBolt, FaShieldAlt];
              const Icon = icons[i % 3];
              return (
                <figure key={`img-${i}`} data-col={i % 7} className="grid__item m-0 relative z-10 [perspective:800px] will-change-[transform,opacity] group cursor-pointer">
                  <div className="grid__item-img w-full h-full rounded-xl overflow-hidden shadow-sm border border-zinc-900 bg-zinc-950 flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-105 group-hover:border-sky-500/30 relative">
                    <img src={item} alt="Fleet" className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sky-400 text-xs pointer-events-none">
                      <Icon />
                    </div>
                  </div>
                </figure>
              );
            }
            return null;
          })}
        </div>
      </section>
      {showFooter && null}
    </div>
  );
}

export default StaggeredGrid;
