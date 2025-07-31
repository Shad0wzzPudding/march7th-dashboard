import { useState, useEffect } from 'react';

const march7thGreetings = [
  "Heyyy Shad0wzz! How's your day going today?? 😊",
  "Welcome back! Ready for another adventure? 📸✨",
  "Ooh, perfect timing! I was just organizing some photos! 📷",
  "Hi there! Got any exciting plans for today? 🌟",
  "Yay, you're here! Let's make today super productive! 💫",
  "Hello hello! Ready to tackle your tasks like a true Trailblazer? 🚀",
  "Heya! Time to check what's on your agenda! 📝",
  "Welcome! I've been waiting to show you all your updates! ✨"
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
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-welcome-primary to-welcome-secondary bg-clip-text text-transparent mb-4 animate-fade-in">
        {greeting}
      </h1>
      <div className="w-24 h-1 bg-gradient-to-r from-welcome-primary to-welcome-secondary mx-auto rounded-full animate-scale-in" />
    </div>
  );
};