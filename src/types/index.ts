export type ScanResult = 'cool' | 'hot';

export interface ScanningAnimationProps {
  isScanning: boolean;
}

export interface MeterProps {
  progress: number;
}

export interface ResultScreenProps {
  result: ScanResult;
}