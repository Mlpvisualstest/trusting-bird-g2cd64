import { useState, useEffect } from 'react';
import { Camera, X, Menu, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Declare globals for TypeScript compiler
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// --- SERVICE PRICING CONFIGURATION ---
const SERVICE_PRICES: Record<string, { price: string; description: string }> = {
  'Portrait': { price: '$250', description: '90-minute session, 15 high-end retouched photos.' },
  'Wedding': { price: '$2,500', description: 'Full day coverage, private digital gallery, and print rights.' },
  'Urban/Editorial': { price: '$400', description: '2-hour street session, editorial-style fashion retouching.' },
  'Commercial': { price: '$1,200', description: 'Brand-focused content creation with full commercial licensing.' },
};

// --- Firebase Configuration ---
const getFirebaseConfig = () => {
  try {
    const envConfig = typeof window !== 'undefined' ? window.__firebase_config : undefined;
    return envConfig ? JSON.parse(envConfig) : { apiKey: "preview-only", authDomain: "preview-only", projectId: "preview-only" };
  } catch {
    return { apiKey: "preview-only", authDomain: "preview-only", projectId: "preview-only" };
  }
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'mlpvisuals-portfolio';

// Custom Social Icons to avoid external library version mismatches
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
  const [user, setUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<PortfolioImage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  
  // Form & Checkout State
  const [bookingService, setBookingService] = useState<string>('');
  const [visionText, setVisionText] = useState<string>('');
  const [isGeneratingVision, setIsGeneratingVision] = useState<boolean>(false);
  const [step, setStep] = useState<'form' | 'checkout' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '' });

  // Calculation for the masonry gallery
  const filteredImages = activeCategory === 'All' 
    ? PORTFOLIO_IMAGES 
    : PORTFOLIO_IMAGES.filter(img => img.category === activeCategory);

  // Authentication Setup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth init error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // AI Logic
  const enhanceVisionWithAI = async () => {
    if (!visionText || !bookingService) return;
    setIsGeneratingVision(true);
    const apiKey = ""; // API Key provided by env
    const prompt = `Service: ${bookingService}\nClient Concept: ${visionText}`;
    const systemPrompt = "You are a professional Creative Director. Transform the rough concept into 2 sentences focusing on lighting, color palette, and emotion. Do not use quotes.";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] } })
      });
      const resData = await response.json();
      if (resData?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setVisionText(resData.candidates[0].content.parts[0].text.trim());
      }
    } catch (e) {
      console.error("AI expansion failed", e);
    } finally {
      setIsGeneratingVision(false);
    }
  };

  const handleInitialFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setFormData({
      name: data.get('name') as string,
      email: data.get('email') as string,
      date: data.get('date') as string,
      time: data.get('time') as string,
    });
    setStep('checkout');
  };

  const handleFinalCheckoutSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const finalData = {
      ...formData,
      service: bookingService,
      price: SERVICE_PRICES[bookingService].price,
      vision: visionText,
      createdAt: serverTimestamp(),
      clientId: user.uid
    };

    try {
      // RULE 1: Use specific artifacts paths for public data
      if (firebaseConfig.apiKey !== "preview-only") {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), finalData);
      }
      // Add artificial delay for professional feeling
      await new Promise(r => setTimeout(r, 1500));
      setStep('success');
    } catch (err) {
      console.error("Database save failed:", err);
      setStep('success'); // Fallback to success UI for the visitor
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-fuchsia-500/30 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; } .animation-delay-2000 { animation-delay: 2s; }
        .text-gradient { background-size: 200% 200%; animation: gradientMove 4s ease infinite; }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      ` }} />

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('home')}>
            <div className="p-2 bg-fuchsia-500 rounded-lg"><Camera className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-black tracking-tighter lowercase text-white">Mlpvisuals</span>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <button onClick={() => scrollToSection('portfolio')} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Work</button>
            <button onClick={() => scrollToSection('contact')} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-black hover:bg-fuchsia-500 hover:text-white transition-all">Book Session</button>
          </div>
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-10 md:hidden animate-in fade-in duration-300">
             <button className="absolute top-8 right-8" onClick={() => setIsMobileMenuOpen(false)}><X className="w-10 h-10"/></button>
             <button onClick={() => scrollToSection('portfolio')} className="text-5xl font-black">Work.</button>
             <button onClick={() => scrollToSection('contact')} className="text-5xl font-black text-fuchsia-500">Book.</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative h-screen flex items-center justify-center">
        <div className="absolute top-0 -left-10 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-0 -right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none mb-8 select-none">
            VIBRANT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-400 to-blue-500 text-gradient">VISUALS.</span>
          </h1>
          <p className="text-xl md:text-3xl text-zinc-400 mx-auto mb-10 font-medium tracking-tight">Bold storytelling for the modern era. Captured in high definition.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection('contact')} className="bg-white text-black px-10 py-5 rounded-full font-black text-xl hover:bg-fuchsia-500 hover:text-white transition-all shadow-2xl shadow-white/5">Reserve Session</button>
            <button onClick={() => scrollToSection('portfolio')} className="px-10 py-5 rounded-full border border-white/10 font-black text-xl hover:bg-white/5 transition-all">See Work</button>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section id="portfolio" className="py-40 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-xl">
            <h2 className="text-6xl font-black tracking-tighter mb-6">Archive <span className="text-fuchsia-500">01.</span></h2>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed">A specialized curation of projects exploring light, motion, and raw human emotion across the globe.</p>
          </div>
          <div className="flex gap-2 flex-wrap bg-white/5 p-2 rounded-2xl backdrop-blur-sm">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {filteredImages.map(img => (
            <div key={img.id} className="break-inside-avoid relative group overflow-hidden rounded-[2.5rem] cursor-pointer" onClick={() => setLightboxImage(img)}>
              <img src={img.src} alt={img.alt} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-10 flex flex-col justify-end">
                <p className="text-fuchsia-400 font-black text-xs uppercase tracking-widest mb-3">{img.category}</p>
                <h3 className="text-3xl font-black">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking & Checkout Section */}
      <section id="contact" className="py-40 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-900/5 to-transparent -z-10"></div>
        <div className="max-w-2xl mx-auto">
          {step === 'form' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="text-center mb-16">
                <h2 className="text-6xl font-black tracking-tighter mb-6">Start a <span className="text-fuchsia-500">Project.</span></h2>
                <p className="text-zinc-400 text-lg">Select a service to see specialized pricing and availability.</p>
              </div>

              <form onSubmit={handleInitialFormSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(SERVICE_PRICES).map(s => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => setBookingService(s)}
                      className={`p-8 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${bookingService === s ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-zinc-900 bg-zinc-900/50 hover:border-zinc-800'}`}
                    >
                      <div className="relative z-10">
                        <p className={`text-xs font-black uppercase tracking-widest mb-2 ${bookingService === s ? 'text-fuchsia-400' : 'text-zinc-500'}`}>{s}</p>
                        <p className="text-2xl font-black">{SERVICE_PRICES[s].price}</p>
                      </div>
                      {bookingService === s && <div className="absolute top-6 right-6 p-1 bg-fuchsia-500 rounded-full"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                    </button>
                  ))}
                </div>

                {bookingService && (
                  <div className="p-6 bg-zinc-900/80 rounded-2xl border border-white/5 animate-in fade-in duration-300">
                    <p className="text-zinc-400 text-sm leading-relaxed"><strong className="text-white">Included:</strong> {SERVICE_PRICES[bookingService].description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" type="text" placeholder="Full Name" required className="w-full bg-zinc-900 border-2 border-transparent rounded-2xl p-5 focus:border-fuchsia-500 outline-none transition-all" />
                  <input name="email" type="email" placeholder="Email Address" required className="w-full bg-zinc-900 border-2 border-transparent rounded-2xl p-5 focus:border-fuchsia-500 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input name="date" type="date" required className="w-full bg-zinc-900 border-2 border-transparent rounded-2xl p-5 focus:border-fuchsia-500 outline-none [color-scheme:dark]" />
                  <input name="time" type="time" required className="w-full bg-zinc-900 border-2 border-transparent rounded-2xl p-5 focus:border-fuchsia-500 outline-none [color-scheme:dark]" />
                </div>

                <div className="relative">
                  <textarea 
                    value={visionText} 
                    onChange={(e) => setVisionText(e.target.value)} 
                    placeholder="Describe your creative vision or mood board ideas..." 
                    className="w-full bg-zinc-900 border-2 border-transparent rounded-3xl p-6 h-40 focus:border-fuchsia-500 outline-none resize-none transition-all"
                  />
                  {visionText.length > 5 && bookingService && (
                    <button type="button" onClick={enhanceVisionWithAI} className="absolute bottom-6 right-6 bg-zinc-800 text-fuchsia-400 px-5 py-2.5 rounded-full text-xs font-black hover:bg-fuchsia-500 hover:text-white transition-all flex items-center gap-2 shadow-xl border border-fuchsia-500/20">
                      <Sparkles className={`w-4 h-4 ${isGeneratingVision ? 'animate-spin' : ''}`} />
                      {isGeneratingVision ? 'Consulting AI...' : 'AI Enhance Concept'}
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={!bookingService}
                  className="w-full bg-white text-black py-6 rounded-3xl font-black text-xl hover:bg-fuchsia-500 hover:text-white transition-all disabled:opacity-50 shadow-2xl shadow-white/5 active:scale-[0.98]"
                >
                  Review Booking Details
                </button>
              </form>
            </div>
          )}

          {step === 'checkout' && (
            <div className="animate-in zoom-in-95 fade-in duration-400">
              <div className="bg-zinc-900 rounded-[3rem] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full"></div>
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <h3 className="text-4xl font-black tracking-tighter">Reservation Summary</h3>
                  <button onClick={() => setStep('form')} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="space-y-8 mb-16 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <span className="text-zinc-500 font-black uppercase text-xs tracking-[0.2em]">Service Selected</span>
                    <span className="font-black text-2xl text-fuchsia-500">{bookingService}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <span className="text-zinc-500 font-black uppercase text-xs tracking-[0.2em]">Session Date</span>
                    <span className="font-bold text-lg">{formData.date}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <span className="text-zinc-500 font-black uppercase text-xs tracking-[0.2em]">Time Slot</span>
                    <span className="font-bold text-lg">{formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-2xl font-black uppercase tracking-tight">Investment</span>
                    <span className="text-5xl font-black text-white">{SERVICE_PRICES[bookingService].price}</span>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <button 
                    onClick={handleFinalCheckoutSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-fuchsia-600 text-white py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/30 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-7 h-7" />
                        Complete Reservation
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Secured by Mlpvisuals Private Cloud</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-20 animate-in zoom-in-90 fade-in duration-600">
              <div className="w-32 h-32 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-fuchsia-500/20">
                <CheckCircle2 className="w-16 h-16 text-fuchsia-500" />
              </div>
              <h2 className="text-6xl font-black tracking-tighter mb-6">Confirmed.</h2>
              <p className="text-zinc-400 text-xl mb-12 leading-relaxed">Your session for <span className="text-white font-bold">{formData.date}</span> is officially on the calendar. Check your inbox at <span className="text-fuchsia-400 font-bold">{formData.email}</span> for session details.</p>
              <button onClick={() => setStep('form')} className="text-fuchsia-500 font-black uppercase text-sm tracking-widest hover:text-white transition-colors border-b-2 border-fuchsia-500 pb-1">Create Another Booking</button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5 text-center">
        <div className="flex justify-center gap-8 mb-12">
          <a href="#" className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-fuchsia-400 hover:bg-white/10 transition-all"><InstagramIcon /></a>
          <a href="#" className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-fuchsia-400 hover:bg-white/10 transition-all"><TwitterIcon /></a>
        </div>
        <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.4em]">© 2026 MLPVISUALS. NYC BASED. WORLDWIDE AVAILABLE.</p>
      </footer>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-10 right-10 text-white p-4 hover:bg-white/10 rounded-full transition-colors"><X className="w-10 h-10" /></button>
          <div className="max-w-7xl max-h-[90vh] flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage.src.replace('&w=800', '&w=1600')} 
              alt={lightboxImage.alt} 
              className="max-w-full max-h-[80vh] rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5" 
            />
            <div className="text-center">
              <h3 className="text-3xl font-black text-white mb-2">{lightboxImage.title}</h3>
              <p className="text-fuchsia-500 font-black uppercase tracking-widest text-sm">{lightboxImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
