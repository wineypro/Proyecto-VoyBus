import { request } from './client';

export type StopLineDirection = {
  routeId: number;
  direction: string;
  operatingDays: string;
  schedule: string;
  sequence: number;
};

export type StopLineInfo = {
  id: number;
  code: string;
  name: string;
  color: string;
  status: 'active' | 'suspended';
  directions: StopLineDirection[];
};

export type Stop = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lines: StopLineInfo[];
};

// Una función por endpoint. Las pantallas llaman a estas, nunca a fetch directamente.
export const getStops = (query?: string) => {
  const q = query?.trim();
  const path = q ? `/stops?q=${encodeURIComponent(q)}` : '/stops';
  return request<Stop[]>(path);
};

export const getStop = (id: number) => request<Stop>(`/stops/${id}`);