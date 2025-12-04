import React, { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGES } from '../constants';

const ImageCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % PLACEHOLDER_IMAGES.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {PLACEHOLDER_IMAGES.map((src, index) => (
        <div
          key={index}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url("${src}")`,
            opacity: index === currentIndex ? 0.8 : 0, // Slightly transparent
          }}
        />
      ))}
      {/* Overlay gradient to blend with the dark/light theme of the login card */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
    </div>
  );
};

export default ImageCarousel;