import { Link } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

export default function LandingPage() {
    const canvasRef = useRef(null);
    const [stars, setStars] = useState([]);

    useEffect(() => {
        // Generate static twinkling stars
        const generatedStars = [];
        for (let i = 0; i < 150; i++) {
            generatedStars.push({
                id: i,
                size: Math.random() * 2.5 + 0.5,
                left: Math.random() * 100,
                top: Math.random() * 100,
                opacity: Math.random() * 0.7 + 0.3,
                duration: Math.random() * 5 + 2,
            });
        }
        setStars(generatedStars);

        // Floating particles canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width;
        let height;
        let particles = [];
        const PARTICLE_COUNT = 100;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2.8 + 1;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.6 + 0.3;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(195, 192, 255, ${this.opacity})`;
                ctx.shadowColor = 'rgba(195, 192, 255, 0.8)';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        let animationFrameId;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) {
                p.update();
                p.draw();
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="bg-[#131315] text-[#e5e1e4] font-sans min-h-screen flex flex-col relative overflow-x-hidden selection:bg-[#c3c0ff]/20 selection:text-[#c3c0ff] antialiased">
            <style>{`
                .glass-panel {
                    background: rgba(24, 24, 27, 0.35);
                    backdrop-filter: blur(28px) saturate(1.2);
                    -webkit-backdrop-filter: blur(28px) saturate(1.2);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
                }
                .glow-text {
                    text-shadow: 0 0 30px rgba(79, 70, 229, 0.25), 0 0 60px rgba(79, 70, 229, 0.08);
                }
                .hero-glow {
                    position: absolute;
                    top: -20%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 800px;
                    height: 800px;
                    background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(9, 9, 11, 0) 70%);
                    z-index: 1;
                    pointer-events: none;
                }
                .logo-spin {
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(195, 192, 255, 0.25);
                    box-shadow: 0 0 20px rgba(79, 70, 229, 0.35);
                    animation: spin 6s linear infinite;
                    flex-shrink: 0;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes twinkle {
                    0% { opacity: 0.2; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.4); }
                }
                .badge-glow {
                    box-shadow: 0 0 30px rgba(79, 70, 229, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
            `}</style>

            {/* 1. Base background layer */}
            <div className="fixed inset-0 bg-[#09090B] z-0"></div>

            {/* 2. Moving particles canvas */}
            <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none block"></canvas>

            {/* 3. Twinkling stars layer */}
            <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-[#c3c0ff]"
                        style={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            opacity: star.opacity,
                            animation: `twinkle ${star.duration}s infinite alternate ease-in-out`,
                        }}
                    />
                ))}
            </div>

            {/* 4. Hero glow effect */}
            <div className="hero-glow"></div>

            {/* Navbar */}
            <nav className="w-full top-0 px-4 sm:px-6 md:px-10 py-2 bg-transparent z-50 relative">
                <div className="flex justify-between items-center w-full max-w-[1280px] mx-auto py-3 sm:py-6">
                    <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
                        <img src="/img/notracefi.jpeg" alt="NoTracefi Logo" className="w-7 h-7 sm:w-9 sm:h-9 logo-spin" />
                        <span className="text-xl sm:text-[32px] font-bold text-[#c3c0ff] tracking-tight glow-text font-['Sora']">NOTRACE</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button className="text-[#c4c7c8] hover:text-[#c3c0ff] transition-colors hover:bg-white/10 p-2 rounded-full duration-300">
                            <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
                        </button>
                        <Link
                            href="/login"
                            className="bg-[#c3c0ff] text-[#131315] px-4 py-2 sm:px-7 sm:py-2.5 rounded-full text-xs font-bold hover:bg-opacity-90 transition-all scale-95 active:opacity-80 shadow-[0_0_25px_rgba(79,70,229,0.25)] hover:shadow-[0_0_40px_rgba(79,70,229,0.35)] duration-300"
                        >
                            Connect
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-10 py-10 sm:py-16 relative z-10 text-center">
                <div className="glass-panel rounded-full px-5 py-1.5 mb-8 inline-flex items-center gap-2 border border-white/5 badge-glow">
                    <span className="text-[15px]">✨</span>
                    <span className="text-xs text-[#c4c7c8] tracking-[0.2em] uppercase font-medium">Space swap</span>
                </div>

                <h1 className="text-[34px] sm:text-[48px] md:text-[72px] text-[#c3c0ff] glow-text mb-6 max-w-4xl mx-auto tracking-tight leading-[1.1] font-['Sora'] font-semibold">
                    NoTrace<br />
                    
                </h1>

               

                {/* Social Links */}
                <div className="flex items-center gap-4 sm:gap-5 mb-12 sm:mb-20">
                    {/* X (Twitter) Link */}
                    <a
                        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-[#c4c7c8] hover:text-[#c3c0ff] hover:border-[#c3c0ff]/40 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.15)] border border-white/5"
                        href="https://x.com/notracepriv?s=11"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="X (Twitter)"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
                    </a>
                   
                </div>
            </main>

            <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#131315] to-transparent pointer-events-none z-10"></div>
        </div>
    );
}
