import React, { useEffect } from 'react';

interface ResultScreenProps {
  message: string;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ message }) => {
  useEffect(() => {
    console.log("ResultScreen message:", message);
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">Thermal Scan Result</h1>
      <p className="text-xl text-white">{message}</p>
    </div>
  );
};

export default ResultScreen;