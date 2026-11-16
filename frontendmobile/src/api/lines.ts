import { request } from './client';

export type RouteStopItem = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
};

export type LineRoute = {
  id: number;
  lineId: number;
  direction: string;
  operatingDays: string;
  schedule: string;
  origin: string;
  destination: string;
  stops: RouteStopItem[];
};

export type Line = {
  id: number;
  code: string;
  name: string;
  color: string;
  status: 'active' | 'suspended';
  origin: string;
  destination: string;
  isActive: boolean;
};

export type LineDetail = Line & {
  routes: LineRoute[];
};

// Una función por endpoint. Las pantallas llaman a estas, nunca a fetch directamente.
export const getLines = () => request<Line[]>('/lines');
export const getLine = (id: number) => request<LineDetail>(`/lines/${id}`);