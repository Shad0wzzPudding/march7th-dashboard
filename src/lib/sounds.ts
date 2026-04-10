// Sound effects utility using Web Audio API
import { toast } from "@/hooks/use-toast";

// Haptic feedback utility - vibrates if supported
const haptic = (pattern: number | number[] = 30) => {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
};

// Shared AudioContext - unlocked once on first user interaction
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
    console.log('[sounds] Created shared AudioContext, state:', sharedAudioContext.state);
  }
  
  // Always try to resume (no-op if already running)
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  
  return sharedAudioContext;
};

// Call this on first touch to unlock audio for iOS
export const unlockAudio = () => {
  const ctx = getAudioContext();
  // Play a silent buffer to fully unlock
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  console.log('[sounds] Audio unlocked, state:', ctx.state);
};

export const playSuccessSound = () => {
  haptic([20, 30, 20]);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cheerful ascending three-note success chime
    playTone(523.25, now, 0.1);        // C5
    playTone(659.25, now + 0.08, 0.1); // E5
    playTone(783.99, now + 0.16, 0.15); // G5
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playCompletionSound = () => {
  haptic(40);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Satisfying "ding!" completion sound
    playTone(880, now, 0.08);          // A5
    playTone(1318.51, now + 0.06, 0.2); // E6 (higher, bright)
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playMarchSound = () => {
  haptic([15, 20, 15]);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cute ascending two-note chime
    playTone(587.33, now, 0.15);    // D5
    playTone(880, now + 0.1, 0.2);  // A5
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playConfirmSound = () => {
  haptic([10, 15, 10, 15, 10]);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Cheerful ascending confirmation sound
    playTone(523.25, now, 0.08);        // C5
    playTone(659.25, now + 0.06, 0.08); // E5
    playTone(783.99, now + 0.12, 0.12); // G5
    playTone(1046.5, now + 0.18, 0.15); // C6
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playCancelSound = async () => {
  haptic(25);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle'; // Softer sound for cancel
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Descending tones for cancel effect
    playTone(493.88, now, 0.12);        // B4
    playTone(392.00, now + 0.1, 0.12);  // G4
    playTone(329.63, now + 0.2, 0.18);  // E4
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playDeleteSound = async () => {
  haptic([40, 30, 50]);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sawtooth'; // Slightly harsher for delete
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick descending "whoosh" for delete
    playTone(440, now, 0.08);           // A4
    playTone(330, now + 0.06, 0.1);     // E4
    playTone(220, now + 0.12, 0.12);    // A3
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playDuplicateSound = () => {
  haptic([15, 30, 15]);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick double "pop" sound for duplicate
    playTone(698.46, now, 0.08);        // F5
    playTone(698.46, now + 0.1, 0.08);  // F5 (repeat)
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playPinSound = async () => {
  haptic(30);
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Quick ascending "click-pop" for pin
    playTone(600, now, 0.06);           // D#5
    playTone(900, now + 0.05, 0.1);     // A5 (higher)
    
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playUnpinSound = () => {
  haptic([20, 20, 20]);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    console.log('[playUnpinSound] Using shared context, state:', audioContext.state, 'time:', now);
    
    // First tone - descending
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 800;
    osc1.type = 'triangle';
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.start(now);
    osc1.stop(now + 0.08);
    
    // Second tone - lower
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 500;
    osc2.type = 'triangle';
    gain2.gain.setValueAtTime(0.25, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.15);
    
    console.log('[playUnpinSound] Tones scheduled');
    
  } catch (e) {
    console.log('[playUnpinSound] Audio error:', e);
  }
};

export const playUpdateSound = () => {
  haptic(25);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Gentle two-note "swoosh-ding" for updates
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 440; // A4
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc1.start(now);
    osc1.stop(now + 0.1);
    
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 660; // E5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.2);
    
  } catch (e) {
    console.log('[playUpdateSound] Audio error:', e);
  }
};

export const playShutterSound = () => {
  haptic([15, 10, 30]);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // White noise burst for the "click" of a shutter
    const bufferSize = audioContext.sampleRate * 0.06;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = audioContext.createGain();
    noiseSource.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    noiseSource.start(now);

    // Mechanical "clack" tone
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 1200;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    osc.start(now);
    osc.stop(now + 0.03);

    // Soft resonant "ding" after the click
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 2400;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.08, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.12);

  } catch (e) {
    console.log('[playShutterSound] Audio error:', e);
  }
};

export const playEditSound = () => {
  haptic(20);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick ascending "pencil flick" - two bright tones
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 554.37; // C#5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.start(now);
    osc1.stop(now + 0.08);
    
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 739.99; // F#5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.14);
    
  } catch (e) {
    console.log('[playEditSound] Audio error:', e);
  }
};

export const playCollapseSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick descending "fold" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
    
  } catch (e) {
    console.log('[playCollapseSound] Audio error:', e);
  }
};

export const playExpandSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick ascending "unfold" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
    
  } catch (e) {
    console.log('[playExpandSound] Audio error:', e);
  }
};

export const playNavigationSound = () => {
  haptic(10);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;
    
    // Quick subtle "tap" sound for navigation
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 660; // E5
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
    
  } catch (e) {
    console.log('[playNavigationSound] Audio error:', e);
  }
};

export const playSelectModeSound = () => {
  haptic([10, 20, 10]);
  try {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // Camera autofocus "beep-beep" — two short high-pitched tones
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(1760, now, 0.06);          // A6
    playTone(1760, now + 0.09, 0.06);   // A6 (repeat)

  } catch (e) {
    console.log('[playSelectModeSound] Audio error:', e);
  }
};
