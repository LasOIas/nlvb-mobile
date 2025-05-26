import { supabase } from '@/lib/supabase';

export const fetchCheckins = async () => {
  const { data, error } = await supabase.from('checkins').select('player_id');
  if (error) {
    console.error('[fetchCheckins] error:', error.message);
    return [];
  }
  return data?.map(record => record.player_id) || [];
};

export const checkInPlayer = async (playerId: string) => {
  const { data, error } = await supabase.from('checkins').insert([{ player_id: playerId }]);
  if (error) {
    console.error(`[checkInPlayer] failed for ${playerId}:`, error.message);
    return null;
  }
  return data;
};

export const checkOutPlayer = async (playerId: string) => {
  const { error } = await supabase.from('checkins').delete().eq('player_id', playerId);
  if (error) {
    console.error(`[checkOutPlayer] failed for ${playerId}:`, error.message);
  }  
  return;
};

export const cleanUpDuplicateCheckins = async () => {
  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, player_id, created_at');

    if (error) {
      console.error('[Supabase] Failed to fetch checkins:', error.message);
      return;
    }

    const grouped: Record<string, { id: string; created_at: string }[]> = {};
    for (const row of data ?? []) {
      if (!grouped[row.player_id]) grouped[row.player_id] = [];
      grouped[row.player_id].push({ id: row.id, created_at: row.created_at });
    }

    const idsToDelete: string[] = [];
    for (const list of Object.values(grouped)) {
      if (list.length > 1) {
        const sorted = list.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const [, ...extras] = sorted;
        idsToDelete.push(...extras.map(e => e.id));
      }
    }

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('checkins')
        .delete()
        .in('id', idsToDelete);
      if (deleteError) {
        console.error('[Supabase] Failed to delete duplicates:', deleteError.message);
      } else {
        console.log(`✅ Removed ${idsToDelete.length} duplicate check-ins`);
      }
    } else {
      console.log('✅ No duplicate check-ins found');
    }
  } catch (e) {
    console.error('❌ cleanUpDuplicateCheckins crash:', e instanceof Error ? e.message : e);
  }
};
