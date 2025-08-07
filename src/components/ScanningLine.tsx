import React from 'react';

const ScanningLine: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-lg pointer-events-none">
      <div
        className="absolute w-full h-1.5 bg-red-500/80 shadow-[0_0_18px_7px_rgba(255,0,0,0.7)]"
        style={{ animation: 'scan 4s linear infinite' }}
      ></div>
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ScanningLine;