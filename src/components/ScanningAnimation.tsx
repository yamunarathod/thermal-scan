import React from 'react';

const ScanningAnimation: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-pulse bg-blue-500 rounded-full w-24 h-24 mb-4"></div>
      <p className="text-white text-lg">Scanning...</p>
    </div>
  );
};

export default ScanningAnimation;