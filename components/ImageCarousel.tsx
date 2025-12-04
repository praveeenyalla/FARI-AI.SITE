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
    <div className="absolute inset-0 w-full h-full overflow-hidden">
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
    </div>
  );
};

export default ImageCarousel;
