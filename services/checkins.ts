import { supabase } from '@/lib/supabase';

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
  return;
};

export const cleanUpDuplicateCheckins = async () => {
  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, player_id, created_at');

    if (error) throw error;

    const grouped: Record<string, { id: string; created_at: string }[]> = {};

    for (const entry of data || []) {
      if (!grouped[entry.player_id]) grouped[entry.player_id] = [];
      grouped[entry.player_id].push({ id: entry.id, created_at: entry.created_at });
    }

    const idsToDelete: string[] = [];

    for (const entries of Object.values(grouped)) {
      if (entries.length > 1) {
        const sorted = entries.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        // keep the first, delete the rest
        const [, ...extras] = sorted;
        idsToDelete.push(...extras.map(e => e.id));
      }
    }

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('checkins')
        .delete()
        .in('id', idsToDelete);
      if (deleteError) throw deleteError;
      console.log(`✅ Removed ${idsToDelete.length} duplicate check-ins`);
    } else {
      console.log('✅ No duplicate check-ins found');
    }
  } catch (err) {
    console.error('❌ Error cleaning up duplicates:', err instanceof Error ? err.message : err);
  }
};
