// Sound effects utility using Web Audio API
import { toast } from "@/hooks/use-toast";
export const playSuccessSound = () => {
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
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    console.log('[playUnpinSound] AudioContext state:', audioContext.state);
    
    // On iOS, we must resume AND schedule tones synchronously within the gesture
    // The resume() returns immediately even if pending, so we schedule now
    audioContext.resume();
    
    const now = audioContext.currentTime;
    
    // First tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 800;
    osc1.type = 'triangle';
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc1.start(now);
    osc1.stop(now + 0.06);
    
    // Second tone
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 500;
    osc2.type = 'triangle';
    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.13);
    
    console.log('[playUnpinSound] Tones scheduled at', now);
    
  } catch (e) {
    console.log('[playUnpinSound] Audio error:', e);
  }
};
