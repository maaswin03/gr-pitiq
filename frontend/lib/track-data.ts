/**
 * Track Data for GR PitIQ Simulation
 * Physical characteristics of each racing circuit
 */

export interface TrackInfo {
  name: string;
  length: number; // km
  sectors: number[];
  turns: number;
  lapRecord?: string;
}

export const TRACK_DATA = {
  'Barber': {
    name: 'Barber Motorsports Park',
    length: 3.7,
    sectors: [1.2, 1.3, 1.2],
    turns: 16,
    lapRecord: '1:28.745'
  },
  'COTA': {
    name: 'Circuit of The Americas',
    length: 5.513,
    sectors: [1.8, 2.0, 1.713],
    turns: 20,
    lapRecord: '1:35.234'
  },
  'Road America': {
    name: 'Road America',
    length: 6.515,
    sectors: [2.2, 2.3, 2.015],
    turns: 14,
    lapRecord: '1:52.167'
  },
  'Sebring': {
    name: 'Sebring International Raceway',
    length: 6.019,
    sectors: [2.0, 2.1, 1.919],
    turns: 17,
    lapRecord: '1:48.932'
  },
  'Sonoma': {
    name: 'Sonoma Raceway',
    length: 3.99,
    sectors: [1.3, 1.4, 1.29],
    turns: 12,
    lapRecord: '1:32.456'
  },
  'VIR': {
    name: 'Virginia International Raceway',
    length: 5.263,
    sectors: [1.7, 1.9, 1.663],
    turns: 18,
    lapRecord: '1:42.891'
  }
} as const;

export type TrackName = keyof typeof TRACK_DATA;
