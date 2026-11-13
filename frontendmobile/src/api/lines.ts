import { request } from './client';

export type Line = {
  id: number;
  code: string;
  name: string;
  color: string;
  isActive: boolean;
};

// Una función por endpoint. Las pantallas llaman a estas, nunca a fetch directamente.
export const getLines = () => request<Line[]>('/lines');
export const getLine = (id: number) => request<Line>(`/lines/${id}`);