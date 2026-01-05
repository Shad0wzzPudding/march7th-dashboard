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
  console.log("playCancelSound called");
  toast({ title: "🔊 Cancel sound triggered!", duration: 1500 });
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log("AudioContext state:", audioContext.state);
    
    // iOS requires resuming the audio context on user gesture
    if (audioContext.state === 'suspended') {
      console.log("Resuming suspended audio context...");
      await audioContext.resume();
      console.log("AudioContext resumed, new state:", audioContext.state);
    }
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    console.log("Playing tones at:", now);
    playTone(440, now, 0.15);
    playTone(349.23, now + 0.12, 0.2);
    playTone(293.66, now + 0.28, 0.25);
    
  } catch (e) {
    console.error("Audio error:", e);
    toast({ title: "❌ Audio error", description: String(e), variant: "destructive" });
  }
};
