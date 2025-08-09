import React from "react";

interface ResultScreenProps {
  message: string;
  isCool: boolean;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ message, isCool }) => (
  <div className="result-container">
    <video
      src={isCool ? "./videos/cool.mp4" : "./videos/hot.mp4"}
      className="result-video"
      autoPlay
      loop
      muted
      playsInline
    />
    <div className="message-overlay">
    </div>
    <style>{`
      .result-container {
        position: relative;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: black;
      }
      .result-video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10;
      }
      .message-overlay {
        position: relative;
        z-index: 20;
        text-align: center;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      }
      .message-overlay p {
        font-size: 2rem;
        font-weight: bold;
        margin: 0;
        padding: 20px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 10px;
      }
    `}</style>
  </div>
);

export default ResultScreen;