import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Send, Info, Mic, MicOff, ImagePlus, X, Droplets, Flame, Gavel } from 'lucide-react';

interface RantItem {
  id: string;
  text: string;
  initialX: number;
  initialY: number;
}

// Add SpeechRecognition type declarations for TS
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [rant, setRant] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeRants, setActiveRants] = useState<RantItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isConsuming, setIsConsuming] = useState(false);
  const [destructionMethod, setDestructionMethod] = useState<'burn' | 'flood' | 'hammer'>('burn');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Clear the value so the same file can be selected again if removed
    e.target.value = '';
  };

  // Initialize Audio Context on user interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playWhoosh = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 1.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 8;
    filter.frequency.setValueAtTime(40, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 1.8);
  };

  const playThump = (method: 'burn' | 'flood' | 'hammer' | 'rant' = 'rant') => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (method === 'rant') {
      // Sub-heavy impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(1.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Low rumble residue
      const noise = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 1.0;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = b;
      const nGain = ctx.createGain();
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'lowpass';
      nFilter.frequency.value = 150;
      nGain.gain.setValueAtTime(0.4, ctx.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      osc.start();
      noise.start();
    } else if (method === 'burn') {
      // Intense combustion start
      const fireNoise = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 2.5;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      fireNoise.buffer = b;
      
      const fireFilter = ctx.createBiquadFilter();
      fireFilter.type = 'bandpass';
      fireFilter.Q.value = 2;
      fireFilter.frequency.setValueAtTime(100, ctx.currentTime);
      fireFilter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.5);
      
      const fireGain = ctx.createGain();
      fireGain.gain.setValueAtTime(0, ctx.currentTime);
      fireGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.4);
      fireGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      
      fireNoise.connect(fireFilter);
      fireFilter.connect(fireGain);
      fireGain.connect(ctx.destination);
      fireNoise.start(ctx.currentTime + 0.3);
    } else if (method === 'flood') {
      // Heavy water surge
      const surge = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 2.5;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      surge.buffer = b;
      
      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'lowpass';
      sFilter.frequency.setValueAtTime(1000, ctx.currentTime);
      sFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2);
      
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.5, ctx.currentTime);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      
      surge.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(ctx.destination);
      surge.start();
    } else if (method === 'hammer') {
      // Heavy crunch + Metallic Ring
      const crunch = ctx.createOscillator();
      crunch.type = 'square';
      crunch.frequency.setValueAtTime(80, ctx.currentTime);
      crunch.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.1);
      const cGain = ctx.createGain();
      cGain.gain.setValueAtTime(1, ctx.currentTime);
      cGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      crunch.connect(cGain);
      cGain.connect(ctx.destination);
      
      const glass = ctx.createBufferSource();
      const bSize = ctx.sampleRate * 1.5;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      glass.buffer = b;
      const gFilter = ctx.createBiquadFilter();
      gFilter.type = 'highpass';
      gFilter.frequency.value = 4000;
      const gGain = ctx.createGain();
      gGain.gain.setValueAtTime(0.6, ctx.currentTime + 0.3);
      gGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      glass.connect(gFilter);
      gFilter.connect(gGain);
      gGain.connect(ctx.destination);
      
      crunch.start();
      glass.start(ctx.currentTime + 0.3);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("Your browser doesn't support local speech recognition. The void cannot hear you this way.");
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    initAudio();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
      setMessage("The void is listening...");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setRant((prev) => prev + (prev.trim() ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setMessage("Microphone access denied. Speak elsewhere.");
      } else {
        setMessage("The connection to the void flickered. Try again.");
      }
      setTimeout(() => setMessage(null), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
      setMessage(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleScream = useCallback(() => {
    if (!rant.trim()) return;
    initAudio();

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const newRant: RantItem = {
      id: Math.random().toString(36).substring(7),
      text: rant,
      // Random position within a radius of the enlarged circle
      initialX: (Math.random() - 0.5) * 200,
      initialY: (Math.random() - 0.5) * 200,
    };

    setIsConsuming(true);
    setActiveRants((prev) => [...prev, newRant]);
    setRant('');
    
    if (!selectedImage) {
      playWhoosh();
    } else {
      // For images, we play the descriptive sound immediately as the animation starts
      playThump(destructionMethod);
    }

    setTimeout(() => {
      setIsConsuming(false);
      setSelectedImage(null);
      // Final impact follows whoosh/animation (1.8s)
      playThump(selectedImage ? destructionMethod : 'rant');
    }, 1800);

    // Show a message from the void after a short delay
    setTimeout(() => {
      const burnMessages = ["Charred into history.", "Reduced to ash.", "The heat has consumed it."];
      const floodMessages = ["Swept away by the tides.", "Swallowed by the deep.", "Dissolved in the current."];
      const hammerMessages = ["Shattered into silicon dust.", "Reduced to shards.", "Broken beyond repair."];
      
      const pool = destructionMethod === 'burn' ? burnMessages : destructionMethod === 'flood' ? floodMessages : hammerMessages;
      setMessage(pool[Math.floor(Math.random() * pool.length)]);
      
      setTimeout(() => setMessage(null), 3000);
    }, 1000);
  }, [rant]);

  const onRemoveRant = useCallback((id: string) => {
    setActiveRants((prev) => prev.filter((r) => r.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleScream();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScream]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#030005] overflow-hidden px-4">
      <motion.div 
        animate={{ 
          opacity: isConsuming ? 1 : 0.6,
          scale: isConsuming ? 1.1 : 1
        }}
        className="atmosphere" 
        id="void-atmosphere" 
      />

      {/* Decorative Stars */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2}px`,
              height: `${Math.random() * 2}px`,
              opacity: Math.random(),
            }}
          />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-6 sm:gap-12 py-8">
        <header className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-widest uppercase text-purple-200/80 font-serif"
            id="void-title"
          >
            The Void
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-mono tracking-tighter"
            id="void-subtitle"
          >
            NOTHING IS SAVED. EVERYTHING IS CONSUMED.
          </motion.p>
        </header>

        {/* The Blackhole Visual */}
        <motion.div 
          animate={isConsuming ? { x: [0, -2, 2, -2, 2, 0], y: [0, 1, -1, 1, -1, 0] } : {}}
          transition={{ duration: 0.2, repeat: isConsuming ? 5 : 0 }}
          className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center" 
          id="blackhole-container"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: 360 
            }}
            transition={{ 
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            className="absolute rounded-full w-full h-full border border-purple-500/20 blur-xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: -360 
            }}
            transition={{ 
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 15, repeat: Infinity, ease: "linear" }
            }}
            className="absolute rounded-full w-[120%] h-[120%] border border-purple-900/10 blur-2xl"
          />
          <div className={`w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 bg-black rounded-full transition-shadow duration-1000 relative z-10 overflow-hidden flex items-center justify-center ${isConsuming ? 'shadow-[0_0_80px_20px_rgba(168,85,247,0.5)] md:shadow-[0_0_120px_40px_rgba(168,85,247,0.5)]' : 'shadow-[0_0_40px_10px_rgba(107,33,168,0.3)] md:shadow-[0_0_80px_25px_rgba(107,33,168,0.3)]'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {selectedImage && (
                <motion.div
                  key="uploaded-target"
                  className="relative w-full h-full group"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: isConsuming ? [1, 1, 0] : 1, 
                    scale: isConsuming ? [1, 1.05, 0.95] : 1,
                    rotate: isConsuming && destructionMethod === 'flood' ? [0, 180, 1080] : 0,
                    x: isConsuming && destructionMethod === 'hammer' ? [0, -4, 4, -4, 4, 0] : 0,
                    filter: isConsuming 
                      ? destructionMethod === 'burn'
                        ? "brightness(1.5) contrast(1.5) sepia(0.8) hue-rotate(-20deg) grayscale(0.2) blur(1px)"
                        : destructionMethod === 'flood'
                          ? "brightness(1.2) contrast(1.2) hue-rotate(180deg) saturate(2) blur(6px)"
                          : "brightness(2) contrast(1.5) grayscale(1) blur(2px)"
                      : "brightness(1) contrast(1) grayscale(0) sepia(0) hue-rotate(0deg) blur(0px)" 
                  }}
                  transition={{ 
                    duration: isConsuming ? 1.8 : 0.5,
                    times: [0, 0.6, 1],
                    x: { repeat: Infinity, duration: 0.1 }
                  }}
                >
                  <img 
                    src={selectedImage} 
                    alt="The source of your frustration" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  
                  {/* Hammer Cracks */}
                  {isConsuming && destructionMethod === 'hammer' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1] }}
                      transition={{ delay: 0.3, duration: 0.1 }}
                      className="absolute inset-0 z-20 pointer-events-none"
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full stroke-black/80 stroke-[0.5] fill-none">
                        <path d="M50,50 L20,10 M50,50 L80,20 M50,50 L90,60 M50,50 L40,90 M50,50 L10,70" />
                        <path d="M50,50 L30,40 L10,35 M50,50 L60,70 L75,90" />
                      </svg>
                    </motion.div>
                  )}

                  {/* Hammer Impact Flash */}
                  {isConsuming && destructionMethod === 'hammer' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                      className="absolute inset-0 bg-white z-40 mix-blend-overlay"
                    />
                  )}

                  {/* Burn: Lighter Intro */}
                  {isConsuming && destructionMethod === 'burn' && (
                    <motion.div
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: [60, 20, 20, 100], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, times: [0, 0.2, 0.6, 1] }}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-8 h-12 bg-zinc-400 rounded-sm border border-zinc-500 shadow-lg flex flex-col items-center"
                    >
                      <div className="w-6 h-4 bg-zinc-300 rounded-t-sm -mt-2 group-flick" />
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1, 0] }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="w-4 h-6 bg-orange-500 blur-[2px] rounded-full absolute -top-6 animate-pulse"
                      />
                    </motion.div>
                  )}

                  {/* Flood: Swirl Intro */}
                  {isConsuming && destructionMethod === 'flood' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: 0 }}
                      animate={{ scale: [0, 1.2, 1.5], opacity: [0, 0.8, 0], rotate: 1080 }}
                      transition={{ duration: 2.2, ease: "linear" }}
                      className="absolute inset-0 z-30 border-8 border-blue-400/30 rounded-full border-t-blue-400/80 blur-[2px]"
                    />
                  )}

                  {/* Hammer: Strike Intro */}
                  {isConsuming && destructionMethod === 'hammer' && (
                    <motion.div
                      initial={{ y: -100, x: 100, rotate: -45, opacity: 0 }}
                      animate={{ 
                        y: [-100, 0, -20, 0, 100], 
                        x: [100, 0, 20, 0, 150], 
                        rotate: [-45, 0, -10, 0, 45],
                        opacity: [0, 1, 1, 1, 0] 
                      }}
                      transition={{ duration: 1.2, times: [0, 0.3, 0.45, 0.6, 1] }}
                      className="absolute top-1/4 right-1/4 z-30 pointer-events-none"
                    >
                      <div className="w-12 h-6 bg-zinc-600 rounded-sm border-2 border-zinc-700" />
                      <div className="w-2 h-16 bg-amber-900 mx-auto -mt-1 rounded-b-sm border border-amber-950" />
                    </motion.div>
                  )}

                  {/* Intense Burning Effect (Paper Style) */}
                  {isConsuming && destructionMethod === 'burn' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 0, 2, 4],
                          opacity: [0, 1, 1, 1],
                        }}
                        transition={{ duration: 1.2, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
                        className="absolute inset-0 bg-black rounded-full mix-blend-multiply"
                        style={{ 
                          boxShadow: 'inset 0 0 60px 20px #f97316, 0 0 100px 40px #f97316, 0 0 140px 60px #ef4444' 
                        }}
                      />

                      <div className="absolute inset-0 overflow-hidden mix-blend-screen">
                        {[...Array(120)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ 
                              y: 180, 
                              x: (Math.random() - 0.5) * 220, 
                              scale: Math.random() * 3 + 0.5,
                              opacity: 1,
                              backgroundColor: i % 10 === 0 ? "#fff" : i % 4 === 0 ? "#4b5563" : i % 3 === 0 ? "#f97316" : "#ef4444" 
                            }}
                            animate={{ 
                              y: -400, 
                              x: (Math.random() - 0.5) * 350,
                              scale: 0,
                              opacity: 0,
                              rotate: Math.random() * 1440
                            }}
                            transition={{ 
                              duration: 0.8 + Math.random() * 2, 
                              ease: "easeOut",
                              delay: 0.3 + Math.random() * 1.2
                            }}
                            className={`absolute bottom-[-10%] left-1/2 rounded-sm ${
                              i % 10 === 0 ? 'w-1 h-1 blur-[1px]' : 
                              i % 4 === 0 ? 'w-3 h-3 blur-[2px]' : 'w-2 h-4 blur-[1px]'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 0, 1, 0.4, 0], 
                          scale: [0.5, 0.5, 2.5, 4, 6],
                          backgroundColor: ["#f97316", "#f97316", "#fbbf24", "#ef4444", "#000000"]
                        }}
                        transition={{ duration: 1.2, times: [0, 0.3, 0.5, 0.8, 1] }}
                        className="absolute inset-0 blur-3xl rounded-full mix-blend-overlay"
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0, 1, 0], scale: [0.8, 0.8, 1.5, 2] }}
                        transition={{ duration: 2, times: [0, 0.4, 0.7, 1], delay: 0.2 }}
                        className="absolute inset-0 border-[20px] border-orange-500/30 blur-2xl rounded-full"
                      />
                    </div>
                  )}

                  {/* Flood Effect */}
                  {isConsuming && destructionMethod === 'flood' && (
                    <div className="absolute inset-0 pointer-events-none mix-blend-screen">
                      {[...Array(60)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            y: 100, 
                            x: (Math.random() - 0.5) * 150, 
                            scale: Math.random() * 4 + 1,
                            opacity: 1,
                            backgroundColor: i % 2 === 0 ? "#60a5fa" : "#2563eb" 
                          }}
                          animate={{ 
                            y: -300, 
                            x: (Math.random() - 0.5) * 300,
                            scale: 0,
                            opacity: 0,
                            rotate: Math.random() * 360
                          }}
                          transition={{ 
                            duration: 1 + Math.random(), 
                            delay: 0.4 + Math.random() * 0.5,
                            ease: "easeOut"
                          }}
                          className="absolute bottom-[-20%] left-1/2 w-6 h-6 rounded-full blur-xl"
                        />
                      ))}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0, 0.8, 0], scale: [0.8, 0.8, 1.5, 2] }}
                        transition={{ duration: 1.8, times: [0, 0.3, 0.8, 1] }}
                        className="absolute inset-0 bg-blue-500/40 blur-3xl rounded-full"
                      />
                    </div>
                  )}

                  {/* Hammer (Shatter) Effect */}
                  {isConsuming && destructionMethod === 'hammer' && (
                    <div className="absolute inset-0 pointer-events-none mix-blend-overlay">
                      {[...Array(40)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            x: (Math.random() - 0.5) * 50,
                            y: (Math.random() - 0.5) * 50,
                            opacity: 1,
                            scale: 1,
                            backgroundColor: i % 2 === 0 ? "#111" : "#333",
                            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                          }}
                          animate={{ 
                            x: (Math.random() - 0.5) * 400,
                            y: (Math.random() - 0.5) * 400,
                            opacity: 0,
                            scale: 0,
                            rotate: Math.random() * 720
                          }}
                          transition={{ 
                            duration: 0.6 + Math.random() * 0.4, 
                            delay: 0.4,
                            ease: "easeOut" 
                          }}
                          className="absolute top-1/2 left-1/2 w-8 h-8"
                        />
                      ))}
                      <motion.div
                        animate={{ opacity: [0, 0, 1, 0], scale: [1, 1, 1.5, 2] }}
                        transition={{ duration: 0.8, times: [0, 0.4, 0.6, 1] }}
                        className="absolute inset-0 bg-white/40 blur-xl"
                      />
                    </div>
                  )}

                  {/* Delete button on hover */}
                  {!isConsuming && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
                        }}
                        className="p-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full text-red-200 pointer-events-auto transition-all transform scale-90 group-hover:scale-100"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Consuming Animations */}
          <AnimatePresence>
            {activeRants.map((r) => (
              <motion.div
                key={r.id}
                initial={{ 
                  scale: 1, 
                  opacity: 1, 
                  x: r.initialX, 
                  y: r.initialY,
                  rotate: 0 
                }}
                animate={{ 
                  scale: 0, 
                  opacity: 0, 
                  rotate: 720,
                  x: 0,
                  y: 0
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                onAnimationComplete={() => onRemoveRant(r.id)}
                className="absolute z-20 text-purple-200/90 text-xs sm:text-sm whitespace-pre-wrap max-w-[140px] sm:max-w-[180px] text-center pointer-events-none font-serif italic"
                style={{
                  top: '50%',
                  left: '50%',
                  translateX: '-50%',
                  translateY: '-50%',
                }}
              >
                {r.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Input Area */}
        <div className="w-full flex flex-col gap-4" id="input-container">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={rant}
              onChange={(e) => setRant(e.target.value)}
              placeholder="What weighs on your soul? Speak it here..."
              className="relative w-full h-32 sm:h-40 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 text-purple-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-sans leading-relaxed backdrop-blur-sm"
              id="rant-textarea"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {selectedImage && (
                <div className="flex bg-zinc-800/80 rounded-full p-1 border border-zinc-700/50 mr-4 gap-1">
                  <button
                    onClick={() => setDestructionMethod('burn')}
                    className={`p-1.5 rounded-full transition-all ${destructionMethod === 'burn' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-400'}`}
                    title="Burn it"
                  >
                    <Flame size={14} />
                  </button>
                  <button
                    onClick={() => setDestructionMethod('flood')}
                    className={`p-1.5 rounded-full transition-all ${destructionMethod === 'flood' ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-400'}`}
                    title="Flush it"
                  >
                    <Droplets size={14} />
                  </button>
                  <button
                    onClick={() => setDestructionMethod('hammer')}
                    className={`p-1.5 rounded-full transition-all ${destructionMethod === 'hammer' ? 'bg-zinc-500/20 text-zinc-300' : 'text-zinc-500 hover:text-zinc-400'}`}
                    title="Shatter it"
                  >
                    <Gavel size={14} />
                  </button>
                </div>
              )}

              <div className="flex bg-zinc-800/50 rounded-full p-0.5 border border-zinc-700/50 mr-1 text-[9px] font-mono">
                <button
                  onClick={() => setSelectedLang('en-US')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${selectedLang === 'en-US' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setSelectedLang('hi-IN')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${selectedLang === 'hi-IN' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  HI
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 transition-all duration-500 rounded-full ${
                  selectedImage 
                    ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30' 
                    : 'text-zinc-500 hover:text-purple-400 hover:bg-white/5'
                }`}
                title="Set a Target"
                id="target-button"
              >
                <ImagePlus size={18} />
              </button>
              <button
                onClick={toggleListening}
                className={`p-2 transition-all duration-500 rounded-full ${
                  isListening 
                    ? 'text-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-500/30' 
                    : 'text-zinc-500 hover:text-purple-400 hover:bg-white/5'
                }`}
                title={isListening ? "The void is listening..." : "Speak to the void"}
                id="voice-button"
              >
                <Mic size={18} className={isListening ? "animate-pulse" : ""} />
              </button>
              <button
                onClick={() => setRant('')}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                title="Silence locally"
                id="clear-button"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScream}
            disabled={!rant.trim()}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-2xl flex items-center justify-center gap-3 font-semibold tracking-widest uppercase transition-all shadow-lg shadow-purple-900/20 group"
            id="scream-button"
          >
            {rant.trim() ? (
              <>
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                RELEASE INTO THE VOID
              </>
            ) : (
              "SPEAK TO THE DARKNESS"
            )}
          </motion.button>
          
          <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
              <Sparkles size={12} className="text-purple-400" />
              Scream responsibly
            </div>
            <div className="group relative">
              <button className="text-zinc-600 hover:text-zinc-400 p-1" id="info-button">
                <Info size={14} />
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                This is a private space. No data is stored or transmitted. Once it enters the void, it is gone forever.
              </div>
            </div>
          </div>
        </div>

        {/* Void Feedback Message */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs sm:text-sm font-serif italic text-purple-300/60 tracking-widest text-center"
                id="void-message"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="flex flex-col items-center gap-4 pb-8">
          <div className="flex items-center gap-6">
            <a 
              href="https://forms.gle/your-google-form-link" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-purple-400/50 hover:text-purple-400 font-mono uppercase tracking-[0.2em] transition-colors border-b border-purple-900/30 pb-0.5"
            >
              Request a feature / Rate the void
            </a>
          </div>
          <div className="text-[9px] sm:text-[10px] text-zinc-700 font-mono uppercase tracking-[0.2em] pointer-events-none text-center">
            Consuming since 2026 • Silence is Gold
          </div>
        </footer>
      </main>
    </div>
  );
}
