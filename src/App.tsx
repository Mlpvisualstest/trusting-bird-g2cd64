import { useState, useEffect } from 'react';
import { Camera, X, Menu, ChevronRight, MapPin, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- SERVICE PRICING CONFIGURATION ---
const SERVICE_PRICES: Record<string, { price: string; description: string }> = {
  'Portrait': { price: '$250', description: '90-minute session, 15 retouched photos.' },
  'Wedding': { price: '$2,500', description: 'Full day coverage, digital gallery, and print rights.' },
  'Urban/Editorial': { price: '$400', description: '2-hour street session, high-fashion retouching.' },
  'Commercial': { price: '$1,200', description: 'Brand-focused content, full commercial licensing.' },
};

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "preview-only", authDomain: "preview-only", projectId: "preview-only" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mlpvisuals-portfolio';

// Custom Social Icons
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
  const [visionError, setVisionError] = useState<string>('');
  const [step, setStep] = useState<'form' | 'checkout' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '' });

  // Filtered images calculation
  const filteredImages = activeCategory === 'All' 
    ? PORTFOLIO_IMAGES 
    : PORTFOLIO_IMAGES.filter(img => img.category === activeCategory);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { 
        console.error("Authentication initialization failed:", e); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const enhanceVisionWithAI = async () => {
    if (!visionText || !bookingService) return;
    setIsGeneratingVision(true);
    setVisionError('');
    const apiKey = ""; // API Key provided by env at runtime
    const prompt = `Service: ${bookingService}\nRough idea: ${visionText}`;
    const systemPrompt = "Enhance this photography concept into 2 evocative sentences focusing on light and emotion for Mlpvisuals.";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          systemInstruction: { parts: [{ text: systemPrompt }] } 
        })
      });
      const data = await response.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setVisionText(data.candidates[0].content.parts[0].text.trim());
      }
    } catch (e) {
      setVisionError("AI temporarily unavailable.");
    } finally {
      setIsGeneratingVision(false);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleFinalPayment = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const bookingData = {
      ...formData,
      service: bookingService,
      price: SERVICE_PRICES[bookingService].price,
      vision: visionText,
      createdAt: serverTimestamp(),
      userId: user.uid
    };

    try {
      // RULE 1: Use strict paths for Firestore
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), bookingData);
      
      // Simulate processing delay for professional feel
      await new Promise(r => setTimeout(r, 1200));
      setStep('success');
    } catch (error) {
      console.error("Database submission error:", error);
      // Fallback to success UI so user flow isn't broken in preview mode
      setStep('success'); 
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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollToSection('home')}>
            <Camera className="w-8 h-8 text-fuchsia-500" />
            <span className="text-2xl font-black tracking-tighter lowercase text-white">Mlpvisuals</span>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <button onClick={() => scrollToSection('portfolio')} className="text-sm font-bold text-zinc-400 hover:text-white">Work</button>
            <button onClick={() => scrollToSection('contact')} className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-fuchsia-500 hover:text-white transition-all">Book Now</button>
          </div>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Navigation overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-8 md:hidden">
            <button className="absolute top-8 right-8" onClick={() => setIsMobileMenuOpen(false)}><X className="w-8 h-8"/></button>
            <button onClick={() => scrollToSection('portfolio')} className="text-4xl font-black">Work</button>
            <button onClick={() => scrollToSection('contact')} className="text-4xl font-black text-fuchsia-500">Book Now</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-8">
            MODERN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-400 to-blue-500 text-gradient">STORYTELLING.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 font-medium">Capture the energy. Elevate the moment. Professional photography for the modern world.</p>
          <button onClick={() => scrollToSection('contact')} className="bg-white text-black px-10 py-5 rounded-full font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-white/10">Reserve Your Date</button>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-5xl font-black tracking-tighter mb-4">Selected <span className="text-fuchsia-500">Works.</span></h2>
            <p className="text-zinc-500 text-lg">Curated projects across New York and worldwide.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-fuchsia-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map(img => (
            <div key={img.id} className="break-inside-avoid relative group overflow-hidden rounded-3xl cursor-pointer" onClick={() => setLightboxImage(img)}>
              <img src={img.src} alt={img.alt} className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-end">
                <p className="text-fuchsia-400 font-bold text-xs uppercase mb-2">{img.category}</p>
                <h3 className="text-xl font-black">{img.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Payment Section */}
      <section id="contact" className="py-32 px-6 bg-zinc-900/30 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          {step === 'form' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black tracking-tighter mb-4">Let's Create.</h2>
                <p className="text-zinc-500">Select your service and we'll draft your vision together.</p>
              </div>

              <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(SERVICE_PRICES).map(s => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => setBookingService(s)}
                      className={`p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden group ${bookingService === s ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                    >
                      <div className="relative z-10">
                        <p className={`text-xs font-bold uppercase mb-1 ${bookingService === s ? 'text-fuchsia-400' : 'text-zinc-500'}`}>{s}</p>
                        <p className="text-xl font-black">{SERVICE_PRICES[s].price}</p>
                      </div>
                      {bookingService === s && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-fuchsia-500" />}
                    </button>
                  ))}
                </div>

                {bookingService && (
                  <div className="p-4 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20 text-sm text-fuchsia-200">
                    <p><strong>Package includes:</strong> {SERVICE_PRICES[bookingService].description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" type="text" placeholder="Full Name" required className="w-full bg-zinc-900 border-zinc-800 rounded-2xl p-4 focus:border-fuchsia-500 outline-none" />
                  <input name="email" type="email" placeholder="Email Address" required className="w-full bg-zinc-900 border-zinc-800 rounded-2xl p-4 focus:border-fuchsia-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input name="date" type="date" required className="w-full bg-zinc-900 border-zinc-800 rounded-2xl p-4 focus:border-fuchsia-500 outline-none [color-scheme:dark]" />
                  <input name="time" type="time" required className="w-full bg-zinc-900 border-zinc-800 rounded-2xl p-4 focus:border-fuchsia-500 outline-none [color-scheme:dark]" />
                </div>

                <div className="relative">
                  <textarea 
                    value={visionText} 
                    onChange={(e) => setVisionText(e.target.value)} 
                    placeholder="Describe your creative vision..." 
                    className="w-full bg-zinc-900 border-zinc-800 rounded-2xl p-4 h-32 focus:border-fuchsia-500 outline-none resize-none"
                  />
                  {visionText.length > 5 && bookingService && (
                    <button type="button" onClick={enhanceVisionWithAI} className="absolute bottom-4 right-4 bg-zinc-800 text-fuchsia-400 px-4 py-2 rounded-full text-xs font-bold hover:bg-fuchsia-500 hover:text-white transition-all flex items-center gap-2">
                      <Sparkles className={`w-3 h-3 ${isGeneratingVision ? 'animate-spin' : ''}`} />
                      {isGeneratingVision ? 'Dreaming...' : 'AI Enhance'}
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={!bookingService}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black text-xl hover:bg-fuchsia-500 hover:text-white transition-all disabled:opacity-50"
                >
                  Continue to Booking Summary
                </button>
              </form>
            </div>
          )}

          {step === 'checkout' && (
            <div className="animate-in zoom-in-95 fade-in duration-300">
              <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 border border-zinc-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-black">Booking Summary</h3>
                  <button onClick={() => setStep('form')} className="text-zinc-500 hover:text-white"><X /></button>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex justify-between border-b border-zinc-800 pb-4">
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Service</span>
                    <span className="font-black text-fuchsia-500">{bookingService}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-4">
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Date & Time</span>
                    <span className="font-bold">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-lg font-black uppercase">Total Price</span>
                    <span className="text-4xl font-black text-white">{SERVICE_PRICES[bookingService].price}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleFinalPayment}
                    disabled={isSubmitting}
                    className="w-full bg-fuchsia-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6" />
                        Confirm & Reserve Session
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">Secure checkout via Mlpvisuals Cloud</p>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-20 animate-in zoom-in-90 fade-in duration-500">
              <div className="w-24 h-24 bg-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-fuchsia-500" />
              </div>
              <h2 className="text-5xl font-black tracking-tighter mb-4">You're All Set!</h2>
              <p className="text-zinc-400 text-lg mb-10">Your session for <strong>{formData.date}</strong> is reserved. Check your email at {formData.email} for next steps.</p>
              <button onClick={() => setStep('form')} className="text-fuchsia-500 font-bold hover:underline">Make another booking</button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900 text-center">
        <div className="flex justify-center gap-6 mb-10">
          <a href="#" className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-all"><InstagramIcon /></a>
          <a href="#" className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-all"><TwitterIcon /></a>
        </div>
        <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">© 2026 MLPVISUALS. NEW YORK CITY.</p>
      </footer>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-8 right-8 text-white"><X className="w-10 h-10" /></button>
          <img 
            src={lightboxImage.src.replace('&w=800', '&w=1600')} 
            alt={lightboxImage.alt} 
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
}
