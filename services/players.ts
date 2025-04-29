// File: services/players.ts
import { supabase } from '../lib/supabase';

export const fetchPlayers = async () => {
  const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const addPlayer = async (name: string, skill = 0) => {
  const { data, error } = await supabase.from('players').insert([{ name, skill }]);
  if (error) throw error;
  return data;
};

export const updatePlayer = async (id: string, name: string, skill: number) => {
  const { data, error } = await supabase.from('players').update({ name, skill }).eq('id', id);
  if (error) throw error;
  return data;
};

export const deletePlayer = async (id: string) => {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
};