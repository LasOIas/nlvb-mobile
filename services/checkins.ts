// File: services/checkins.ts
import { supabase } from '../lib/supabase';

export const fetchCheckins = async () => {
  const { data, error } = await supabase.from('checkins').select('player_id');
  if (error) throw error;
  return data?.map(record => record.player_id) || [];
};

export const checkInPlayer = async (playerId: string) => {
  const { data, error } = await supabase.from('checkins').insert([{ player_id: playerId }]);
  if (error) throw error;
  return data;
};

export const checkOutPlayer = async (playerId: string) => {
  const { error } = await supabase.from('checkins').delete().eq('player_id', playerId);
  if (error) throw error;
};
