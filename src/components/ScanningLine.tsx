import React from 'react';

interface ScanningLineProps {
  direction: 'scanDown' | 'scanUp';
}

const ScanningLine: React.FC<ScanningLineProps> = ({ direction }) => {
  return (
    <>
      <div className={`scanning-line ${direction}`} />
      <style>{`
        .scanning-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.9), transparent);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.9);
          z-index: 20;
        }
        
        .scanning-line.scanDown {
          top: 0%;
          animation: scan-down 3s linear forwards;
        }

        .scanning-line.scanUp {
          top: 100%;
          animation: scan-up 3s linear forwards;
        }

        @keyframes scan-down {
          from { 
            top: 0%;
            transform: translateY(0);
          }
          to { 
            top: 100%;
            transform: translateY(-100%);
          }
        }
        
        @keyframes scan-up {
          from { 
            top: 100%;
            transform: translateY(-100%);
          }
          to { 
            top: 0%;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ScanningLine;