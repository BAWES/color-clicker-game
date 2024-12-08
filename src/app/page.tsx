'use client';

import { useState, useCallback } from 'react';

export default function Home() {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleClick = useCallback(() => {
    setBackgroundColor(generateRandomColor());
  }, []);

  return (
    <main
      className="min-h-screen w-full cursor-pointer transition-colors duration-500"
      style={{ backgroundColor }}
      onClick={handleClick}
    >
      <div className="fixed top-4 left-4 text-lg font-mono opacity-50">
        Click anywhere to change color
      </div>
      <div className="fixed bottom-4 right-4 text-lg font-mono opacity-50">
        Current color: {backgroundColor}
      </div>
    </main>
  );
}
