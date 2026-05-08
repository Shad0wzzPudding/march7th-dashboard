import { useState, useEffect, useRef } from 'react';
import march7thExcited from '@/assets/march7th-excited.png';
import march7thHappy from '@/assets/march7th-happy.png';
import march7thWinking from '@/assets/march7th-winking.png';
import march7thCandy from '@/assets/march7th-candy.png';
import march7thProud from '@/assets/march7th-proud.png';
import march7thWelcoming from '@/assets/march7th-welcoming.png';
import march7thConfident from '@/assets/march7th-confident.png';

const march7thGreetings = [
  { text: "Heyyy Shad0wzz! How's your day going today??", emoji: "😊", sticker: march7thWelcoming },
  { text: "Welcome back! Ready for another adventure?", emoji: "📸✨", sticker: march7thExcited },
  { text: "Ooh, perfect timing! I was just organizing some photos!", emoji: "📷", sticker: march7thCandy },
  { text: "Hi there! Got any exciting plans for today?", emoji: "🌟", sticker: march7thWelcoming },
  { text: "Yay, you're here! Let's make today super productive!", emoji: "💫", sticker: march7thHappy },
  { text: "Hello hello! Ready to tackle your tasks like a true Trailblazer?", emoji: "🚀", sticker: march7thProud },
  { text: "Heya! Time to check what's on your agenda!", emoji: "📝", sticker: march7thWinking },
  { text: "Welcome! I've been waiting to show you all your updates!", emoji: "✨", sticker: march7thConfident },
];

export const WelcomeMessage = () => {
  const [greeting] = useState(() => {
    const randomIndex = Math.floor(Math.random() * march7thGreetings.length);
    return march7thGreetings[randomIndex];
  });
  const [displayedText, setDisplayedText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typingComplete = useRef(false);

  useEffect(() => {
    if (typingComplete.current) return;
    
    let currentIndex = 0;
    const typingSpeed = 40; // ms per character

    const typingInterval = setInterval(() => {
      if (currentIndex < greeting.text.length) {
        setDisplayedText(greeting.text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        typingComplete.current = true;
        setShowEmoji(true);
        // Hide cursor after typing is complete
        setTimeout(() => setShowCursor(false), 500);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [greeting.text]);

  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center mb-4">
        <img 
          src={greeting.sticker} 
          alt="March 7th" 
          className={`w-24 h-24 object-contain transition-all duration-500 ${showEmoji ? 'animate-bounce' : 'opacity-80'}`}
        />
      </div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 flex flex-wrap items-center justify-center gap-2 min-h-[2.5em]">
        <span className="bg-gradient-to-r from-welcome-primary to-welcome-secondary bg-clip-text text-transparent">
          {displayedText}
          {showCursor && (
            <span className="inline-block w-[3px] h-[1em] bg-welcome-primary ml-1 animate-pulse align-middle" />
          )}
        </span>
        <span className={`transition-opacity duration-300 ${showEmoji ? 'opacity-100' : 'opacity-0'}`}>
          {greeting.emoji}
        </span>
      </h1>
      <div className={`w-24 h-1 bg-gradient-to-r from-welcome-primary to-welcome-secondary mx-auto rounded-full transition-transform duration-300 ${showEmoji ? 'scale-100' : 'scale-0'}`} />
    </div>
  );
};
