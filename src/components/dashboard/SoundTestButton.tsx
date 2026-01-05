import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Volume2 } from "lucide-react";

export const SoundTestButton = () => {
  const handlePress = () => {
    console.log("SoundTestButton pressed!");
    
    // Show toast first
    toast({ 
      title: "🔊 Button pressed!", 
      description: "Sound test triggered",
      duration: 2000 
    });
    
    // Try to play sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext created, state:", audioContext.state);
      
      // Resume if suspended (required for iOS)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log("AudioContext resumed");
          playTones(audioContext);
        });
      } else {
        playTones(audioContext);
      }
    } catch (e) {
      console.error("Audio error:", e);
      toast({ 
        title: "❌ Audio error", 
        description: String(e), 
        variant: "destructive" 
      });
    }
  };

  const playTones = (audioContext: AudioContext) => {
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
    console.log("Playing cancel tones at:", now);
    // Descending tones for cancel effect
    playTone(493.88, now, 0.12);        // B4
    playTone(392.00, now + 0.1, 0.12);  // G4
    playTone(329.63, now + 0.2, 0.18);  // E4
    
    toast({ 
      title: "🔕 Cancel sound!", 
      description: "Did you hear the descending tone?",
      duration: 2000 
    });
  };

  return (
    <Button
      onClick={handlePress}
      onTouchEnd={(e) => {
        e.preventDefault();
        handlePress();
      }}
      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
    >
      <Volume2 className="mr-2 h-4 w-4" />
      Test Sound
    </Button>
  );
};
