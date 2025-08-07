import ThermalScanner from '@/components/ThermalScanner';

const ScanPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <ThermalScanner />
    </div>
  );
};

export default ScanPage;