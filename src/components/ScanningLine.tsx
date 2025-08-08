import React from "react";

const ScanningLine: React.FC = () => (
  <div className="scanning-line">
    <style>{`
      .scanning-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(0, 255, 255, 0.8);
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        z-index: 20;
        animation: scan 3s linear 1; /* Run once */
      }
      @keyframes scan {
        0% { top: 0; }
        100% { top: 100%; }
      }
    `}</style>
  </div>
);

export default ScanningLine;