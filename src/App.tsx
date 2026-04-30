import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Send, Info, Mic, MicOff, UserPlus, X } from 'lucide-react';

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
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(50, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 2.0);
  };

  const playThump = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Primary Sub-bass layer - Heavy and Low
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Second Bass layer for "Punch"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(60, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.8, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Impact crackle layer - Louder and more distorted
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 800;
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.buffer = buffer;
    osc.start();
    osc2.start();
    noise.start();
    osc.stop(ctx.currentTime + 1.0);
    osc2.stop(ctx.currentTime + 0.5);
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
    playWhoosh();

    setTimeout(() => {
      setIsConsuming(false);
      setSelectedImage(null);
      playThump();
    }, 1200);

    // Show a message from the void after a short delay
    setTimeout(() => {
      const messages = [
        "The void has consumed your burden.",
        "Your silence is now part of the stars.",
        "Released into oblivion.",
        "The darkness feels lighter now.",
        "Whispered away.",
      ];
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
      
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

      <main className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-12">
        <header className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-light tracking-widest uppercase text-purple-200/80 font-serif"
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
        <div className="relative w-96 h-96 flex items-center justify-center scale-110 md:scale-125" id="blackhole-container">
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
          <div className={`w-56 h-56 bg-black rounded-full transition-shadow duration-1000 relative z-10 overflow-hidden flex items-center justify-center ${isConsuming ? 'shadow-[0_0_120px_40px_rgba(168,85,247,0.5)]' : 'shadow-[0_0_80px_25px_rgba(107,33,168,0.3)]'}`}>
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
                    filter: isConsuming 
                      ? "brightness(1.5) contrast(1.5) sepia(0.8) hue-rotate(-20deg) grayscale(0.2) blur(1px)" 
                      : "brightness(1) contrast(1) grayscale(0) sepia(0) hue-rotate(0deg) blur(0px)" 
                  }}
                  transition={{ 
                    duration: isConsuming ? 1.2 : 0.5,
                    times: [0, 0.4, 1]
                  }}
                >
                  <img 
                    src={selectedImage} 
                    alt="The source of your frustration" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  
                  {/* Intense Burning Effect (Paper Style) */}
                  {isConsuming && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* The "Charred Edge" that eats the image */}
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 2, 4],
                          opacity: [0, 1, 1],
                        }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 bg-black rounded-full mix-blend-multiply"
                        style={{ 
                          boxShadow: 'inset 0 0 60px 20px #f97316, 0 0 100px 40px #f97316, 0 0 140px 60px #ef4444' 
                        }}
                      />

                      {/* Ash and Embers - Increased count and variety */}
                      <div className="absolute inset-0 overflow-hidden mix-blend-screen">
                        {[...Array(120)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ 
                              y: 180, 
                              x: (Math.random() - 0.5) * 220, 
                              scale: Math.random() * 3 + 0.5,
                              opacity: 1,
                              // Mix of embers (orange/red), white-hot sparks, and ash (gray)
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
                              delay: Math.random() * 1.5
                            }}
                            className={`absolute bottom-[-10%] left-1/2 rounded-sm ${
                              i % 10 === 0 ? 'w-1 h-1 blur-[1px]' : 
                              i % 4 === 0 ? 'w-3 h-3 blur-[2px]' : 'w-2 h-4 blur-[1px]'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Final Heat Flash and Fire Core */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: [0, 1, 0.4, 0], 
                          scale: [0.5, 2.5, 4, 6],
                          backgroundColor: ["#f97316", "#fbbf24", "#ef4444", "#000000"]
                        }}
                        transition={{ duration: 1.2, times: [0, 0.3, 0.6, 1] }}
                        className="absolute inset-0 blur-3xl rounded-full mix-blend-overlay"
                      />

                      {/* Intense glowing ring */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 2] }}
                        transition={{ duration: 2, delay: 0.2 }}
                        className="absolute inset-0 border-[20px] border-orange-500/30 blur-2xl rounded-full"
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
                className="absolute z-20 text-purple-200/90 text-sm whitespace-pre-wrap max-w-[180px] text-center pointer-events-none font-serif italic"
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
        </div>

        {/* Input Area */}
        <div className="w-full flex flex-col gap-4" id="input-container">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={rant}
              onChange={(e) => setRant(e.target.value)}
              placeholder="What weighs on your soul? Speak it here..."
              className="w-full h-40 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-purple-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-sans leading-relaxed backdrop-blur-sm"
              id="rant-textarea"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
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
                <UserPlus size={18} />
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
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-12 text-sm font-serif italic text-purple-300/60 tracking-widest"
              id="void-message"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-4 left-4 text-[10px] text-zinc-700 font-mono uppercase tracking-[0.2em] pointer-events-none">
        Consuming since 2026 • Silence is Gold
      </footer>
    </div>
  );
}
