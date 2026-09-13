import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react';

const BG_IMAGE_1 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";

const SPOTLIGHT_R = 260;

function RevealLayer({ image, cursorX, cursorY }: { image: string, cursorX: number, cursorY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas(); // Initial size
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (cursorX !== -999 && cursorY !== -999) {
      const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
      gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
      gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
      ctx.fill();
    }

    setMaskDataUrl(canvas.toDataURL());
  }, [cursorX, cursorY]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none" 
        style={{ display: 'none' }} 
      />
      <div 
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ 
          backgroundImage: `url(${image})`,
          maskImage: `url(${maskDataUrl})`,
          WebkitMaskImage: `url(${maskDataUrl})`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    </>
  );
}

export default function App() {
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (smooth.current.x === -999) {
        smooth.current.x = e.clientX;
        smooth.current.y = e.clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      if (smooth.current.x !== -999) {
        smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
        smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
        setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Navigation (fixed, over hero) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">Lithos</span>
        </div>
        
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          <button className="text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 transition-colors">Course</button>
          <button className="text-white/80 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 hover:text-white transition-colors">Field Guides</button>
          <button className="text-white/80 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 hover:text-white transition-colors">Geology</button>
          <button className="text-white/80 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 hover:text-white transition-colors">Plans</button>
          <button className="text-white/80 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/20 hover:text-white transition-colors">Live Tour</button>
        </div>
        
        <button className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100">
          Sign Up
        </button>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {isMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl p-4 shadow-xl z-50 md:hidden flex flex-col gap-2">
            <button className="text-left font-medium text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100">Course</button>
            <button className="text-left font-medium text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">Field Guides</button>
            <button className="text-left font-medium text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">Geology</button>
            <button className="text-left font-medium text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">Plans</button>
            <button className="text-left font-medium text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">Live Tour</button>
            <hr className="my-2" />
            <button className="bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-full">Sign Up</button>
          </div>
        )}
      </nav>

      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        {/* Base image */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />
        
        {/* Reveal layer */}
        <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} />
        
        {/* Heading */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span 
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal" 
              style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
            >
              Layers hold
            </span>
            <span 
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal" 
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              tales of time
            </span>
          </h1>
        </div>

        {/* Bottom-left paragraph */}
        <div 
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Every layer of sediment records a chapter of our planet, from ancient seabeds to drifting ash, layered across millions of years beneath us.
          </p>
        </div>

        {/* Bottom-right block */}
        <div 
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.85s' }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Our interactive maps let you peel back the crust to trace how stones, fossils, and deep time combine to shape the ground beneath your feet.
          </p>
          <button className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30">
            Start Digging
          </button>
        </div>
      </section>
    </div>
  );
}