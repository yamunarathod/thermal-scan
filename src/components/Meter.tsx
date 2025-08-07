import React from 'react';

const Meter: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="relative w-full h-10 bg-gray-300 rounded-full overflow-hidden">
      <div
        className="absolute h-full bg-green-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      <span className="absolute left-1/2 transform -translate-x-1/2 text-white font-bold">
        {progress}%
      </span>
    </div>
  );
};

export default Meter;