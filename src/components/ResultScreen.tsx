import React from "react";

interface ResultScreenProps {
  message: string;
  isCool: boolean;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ message, isCool }) => (
  <div className="result-container">
    <img
      src={isCool ? "./images/cool.png" : "./images/hot.png"}
      alt={isCool ? "Cool result" : "Hot result"}
      className="result-image"
    />
    <div className="message-overlay">
      <p>{message}</p>
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
      .result-image {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10;
      }
      .message-overlay {
       
      }
      .message-overlay p {
     
      }
    `}</style>
  </div>
);

export default ResultScreen;