import { useState, useEffect } from 'react';
import { Camera, X, Menu, ChevronRight, MapPin, Sparkles } from 'lucide-react';

// Custom Social Icons to avoid library version errors
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

interface PortfolioImage {
  id: number;
  src: string;
  category: string;
  title: string;
  alt: string;
}

const PORTFOLIO_IMAGES: PortfolioImage[] = [
  { id: 1, src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', category: 'Portrait', title: 'Urban Gaze', alt: 'Portrait of a man' },
  { id: 2, src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80', category: 'Nature', title: 'Misty Mountains', alt: 'Misty mountain landscape' },
  { id: 3, src: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80', category: 'Urban', title: 'Neon Nights', alt: 'City street at night' },
  { id: 4, src: 'https://images.unsplash.com/photo-1519741497673-10d95c10214a?auto=format&fit=crop&w=800&q=80', category: 'Wedding', title: 'The First Dance', alt: 'Couple dancing' },
  { id: 5, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', category: 'Portrait', title: 'Golden Hour', alt: 'Woman in sunlight' },
  { id: 6, src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80', category: 'Nature', title: 'Serene Lakes', alt: 'Calm lake surrounded by trees' },
  { id: 7, src: 'https://images.unsplash.com/photo-1477959858617-67f8519776bf?auto=format&fit=crop&w=800&q=80', category: 'Urban', title: 'Concrete Jungle', alt: 'Looking up at skyscrapers' },
  { id: 8, src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80', category: 'Wedding', title: 'Vows', alt: 'Wedding ceremony details' },
  { id: 9, src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', category: 'Portrait', title: 'Studio Session', alt: 'Woman looking at camera' },
  { id: 10, src: 'https://images.unsplash.com/photo-1426604966848-d56bc144cb85?auto=format&fit=crop&w=800&q=80', category: 'Nature', title: 'Forest Path', alt: 'Path through a dense forest' },
  { id: 11, src: 'https://images.unsplash.com/photo-1514565131-b847844be8b2?auto=format&fit=crop&w=800&q=80', category: 'Urban', title: 'Subway Symmetry', alt: 'Subway station interior' },
  { id: 12, src: 'https://images.unsplash.com/photo-1469334023215-813d9b071415?auto=format&fit=crop&w=800&q=80', category: 'Nature', title: 'Desert Dunes', alt: 'Sand dunes in the desert' },
];

const CATEGORIES: string[] = ['All', 'Portrait', 'Nature', 'Urban', 'Wedding'];

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<PortfolioImage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [bookingService, setBookingService] = useState<string>('');
  const [visionText, setVisionText] = useState<string>('');
  const [isGeneratingVision, setIsGeneratingVision] = useState<boolean>(false);
  const [visionError, setVisionError] = useState<string>('');

  const enhanceVisionWithAI = async () => {
    if (!visionText || !bookingService) return;
    setIsGeneratingVision(true);
    setVisionError('');

    const apiKey = ""; 
    const prompt = `Service: ${bookingService}\nClient's rough idea: ${visionText}`;
    const systemPrompt = "You are a creative director for Mlpvisuals photography. Enhance the client's rough idea into a beautiful, evocative 2-3 sentence photography mood board/concept. Focus on lighting, colors, and emotion. Return ONLY the enhanced description without any introductory text or quotes.";

    const makeRequest = async () => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      if (!response.ok) throw new Error('API Error');
      return response.json();
    };

    const delays = [1000, 2000, 4000, 8000, 16000];
    let success = false;
    let data: any;

    for (let i = 0; i < delays.length; i++) {
      try {
        data = await makeRequest();
        success = true;
        break;
      } catch (err) {
        if (i < delays.length - 1) {
          await new Promise(res => setTimeout(res, delays[i]));
        }
      }
    }

    if (success && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      setVisionText(data.candidates[0].content.parts[0].text.trim());
    } else {
      setVisionError("AI is currently unavailable. Please try again later.");
    }
    setIsGeneratingVision(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImage(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredImages = activeCategory === 'All' ? PORTFOLIO_IMAGES : PORTFOLIO_IMAGES.filter(img => img.category === activeCategory);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; } .animation-delay-4000 { animation-delay: 4s; }
        .text-gradient { background-size: 200% 200%; animation: gradientMove 4s ease infinite; }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      ` }} />

      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/70 backdrop-blur-xl py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('home')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 to-violet-600 p-[2px] group-hover:rotate-180 transition-transform duration-700">
              <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center"><Camera className="w-5 h-5 text-fuchsia-400" /></div>
            </div>
            <span className="text-2xl font-black tracking-tighter lowercase text-white group-hover:text-fuchsia-400 transition-colors">Mlpvisuals</span>
          </div>
          <div className="hidden md:flex gap-1 bg-white/5 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
            <button onClick={() => scrollToSection('portfolio')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-300 hover:text-white transition-all">Work</button>
            <button onClick={() => scrollToSection('about')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-300 hover:text-white transition-all">About</button>
            <button onClick={() => scrollToSection('contact')} className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black ml-2 hover:bg-zinc-200 transition-colors">Book Now</button>
          </div>
          <button className="md:hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <div className={`md:hidden absolute top-0 left-0 w-full h-screen bg-zinc-950/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={() => scrollToSection('portfolio')} className="text-4xl font-black hover:text-fuchsia-400 transition-colors">Work.</button>
          <button onClick={() => scrollToSection('about')} className="text-4xl font-black hover:text-fuchsia-400 transition-colors">About.</button>
          <button onClick={() => scrollToSection('contact')} className="text-4xl font-black text-fuchsia-400">Book Now</button>
        </div>
      </nav>

      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute inset-0 z-0 opacity-20"><img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2000&q=80" className="w-full h-full object-cover" alt="Hero background" /></div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"><Sparkles className="w-4 h-4 text-fuchsia-400" /><span className="text-xs font-semibold uppercase text-zinc-300">Available for booking 2026</span></div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 leading-[0.9]">Modern <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-violet-400 to-blue-400 text-gradient">Storytelling.</span></h1>
          <p className="text-lg md:text-2xl text-zinc-400 mb-10 max-w-2xl font-medium">Mlpvisuals brings your moments to life with vibrant, dynamic, and unapologetically bold photography.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => scrollToSection('portfolio')} className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-white/5">See the Work<ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
            <button onClick={() => scrollToSection('contact')} className="px-8 py-4 rounded-full font-bold text-white bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">Book Now</button>
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-32 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div><h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Selected <span className="text-fuchsia-400">Works.</span></h2><p className="text-zinc-400 text-lg max-w-md">A curated collection of recent projects exploring light, color, and raw emotion.</p></div>
          <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
            {CATEGORIES.map(category => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${activeCategory === category ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>{category}</button>
            ))}
          </div>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map((img) => (
            <div key={img.id} className="break-inside-avoid relative group overflow-hidden rounded-3xl cursor-pointer transform transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-fuchsia-500/10" onClick={() => setLightboxImage(img)}>
              <img src={img.src} alt={img.alt} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-fuchsia-300 w-fit mb-3">{img.category}</span>
                <h3 className="text-2xl text-white font-black tracking-tight">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 -skew-y-6 -translate-y-1/2 -z-10"></div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 to-violet-500 rounded-3xl transform rotate-3 scale-105 opacity-50 group-hover:rotate-6 transition-transform"></div>
            <img src="https://images.unsplash.com/photo-1554046920-90dcac824b20?auto=format&fit=crop&w=1000&q=80" className="relative w-full aspect-[4/5] object-cover rounded-3xl shadow-2xl" alt="Mlpvisuals Creator" />
          </div>
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">The Face Behind <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400">Mlpvisuals.</span></h2>
            <div className="space-y-6 text-zinc-300 text-lg md:text-xl font-medium leading-relaxed">
              <p>I'm a visual artist pushing the boundaries of modern photography. For me, an image isn't just a record of a moment—it's a canvas for color, energy, and storytelling.</p>
              <p>Ditching the overly-traditional, I specialize in creating vibrant, lively visuals that jump off the screen.</p>
            </div>
            <div className="mt-12 flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl w-fit backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center"><MapPin className="w-6 h-6 text-violet-400" /></div>
              <div><p className="font-bold text-white">Based in New York</p><p className="text-sm text-zinc-400 font-semibold">Available worldwide</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-32 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
          <div className="relative z-10 text-center mb-12"><h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Ready to create?</h2><p className="text-zinc-400 text-lg">Select your preferred service and timing below.</p></div>
          <form className="relative z-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-400 ml-2 uppercase tracking-widest">1. Choose Type of Service <span className="text-fuchsia-400">*</span></label>
              <div className="flex flex-wrap gap-3">
                {['Portrait', 'Wedding', 'Urban/Editorial', 'Commercial'].map(s => (
                  <button key={s} type="button" onClick={() => setBookingService(s)} className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all ${bookingService === s ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg' : 'bg-zinc-950 border border-white/10 text-zinc-400 hover:text-white'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input type="text" placeholder="Name" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-fuchsia-500 outline-none transition-all" required /><input type="email" placeholder="Email" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-fuchsia-500 outline-none transition-all" required /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input type="date" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white [color-scheme:dark] outline-none focus:border-fuchsia-500 transition-all" required /><input type="time" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white [color-scheme:dark] outline-none focus:border-fuchsia-500 transition-all" required /></div>
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-zinc-400 ml-2 flex justify-between items-center uppercase tracking-widest"><span>Vision & Details</span>{visionError && <span className="text-red-400 text-xs normal-case">{visionError}</span>}</label>
              <div className="relative">
                <textarea value={visionText} onChange={(e) => setVisionText(e.target.value)} rows={4} className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:border-fuchsia-500 outline-none resize-none pb-14 transition-all" placeholder="Briefly describe your vision..."></textarea>
                {visionText.length > 3 && bookingService && (<button type="button" onClick={enhanceVisionWithAI} disabled={isGeneratingVision} className="absolute bottom-4 right-4 text-xs font-bold px-4 py-2 rounded-full bg-zinc-800 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-2 hover:bg-fuchsia-500/20 transition-all shadow-lg hover:shadow-fuchsia-500/20"><Sparkles className={`w-3.5 h-3.5 ${isGeneratingVision ? 'animate-spin' : ''}`} />{isGeneratingVision ? 'Enhancing...' : 'Enhance with AI'}</button>)}
              </div>
            </div>
            <button type="submit" className={`w-full font-black text-lg py-5 rounded-2xl transition-all ${bookingService ? 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:shadow-xl hover:-translate-y-1' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`} disabled={!bookingService}>{bookingService ? 'Request Booking' : 'Select a Service to Continue'}</button>
          </form>
        </div>
      </section>

      <footer className="py-12 text-center bg-zinc-950 border-t border-white/5">
        <div className="flex justify-center gap-6 mb-8">
          <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-fuchsia-400 transition-all shadow-lg hover:shadow-fuchsia-500/20">
            <InstagramIcon />
          </a>
          <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-fuchsia-400 transition-all shadow-lg hover:shadow-fuchsia-500/20">
            <TwitterIcon />
          </a>
        </div>
        <p className="text-zinc-600 text-sm font-bold tracking-widest uppercase">&copy; {new Date().getFullYear()} Mlpvisuals. All rights reserved.</p>
      </footer>

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white" onClick={() => setLightboxImage(null)}><X className="w-6 h-6" /></button>
          <div className="relative max-w-6xl max-h-full w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.src.replace('&w=800', '&w=1600')} alt={lightboxImage.alt} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl shadow-black/50" />
            <div className="mt-6 text-center"><h3 className="text-2xl font-black text-white">{lightboxImage.title}</h3><p className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm mt-1">{lightboxImage.category}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
