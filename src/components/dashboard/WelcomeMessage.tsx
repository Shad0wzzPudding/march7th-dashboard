import { useState, useEffect } from 'react';

const march7thGreetings = [
  { text: "Heyyy Shad0wzz! How's your day going today??", emoji: "😊" },
  { text: "Welcome back! Ready for another adventure?", emoji: "📸✨" },
  { text: "Ooh, perfect timing! I was just organizing some photos!", emoji: "📷" },
  { text: "Hi there! Got any exciting plans for today?", emoji: "🌟" },
  { text: "Yay, you're here! Let's make today super productive!", emoji: "💫" },
  { text: "Hello hello! Ready to tackle your tasks like a true Trailblazer?", emoji: "🚀" },
  { text: "Heya! Time to check what's on your agenda!", emoji: "📝" },
  { text: "Welcome! I've been waiting to show you all your updates!", emoji: "✨" }
];

export const WelcomeMessage = () => {
  const [greeting, setGreeting] = useState(march7thGreetings[0]);

  useEffect(() => {
    // Pick a random greeting when component mounts
    const randomIndex = Math.floor(Math.random() * march7thGreetings.length);
    setGreeting(march7thGreetings[randomIndex]);
  }, []);

  return (
    <div className="text-center py-8 px-4">
      <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in flex flex-wrap items-center justify-center gap-2">
        <span className="bg-gradient-to-r from-welcome-primary to-welcome-secondary bg-clip-text text-transparent">
          {greeting.text}
        </span>
        <span>{greeting.emoji}</span>
      </h1>
      <div className="w-24 h-1 bg-gradient-to-r from-welcome-primary to-welcome-secondary mx-auto rounded-full animate-scale-in" />
    </div>
  );
};