import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SortOption } from '@/components/dashboard/SortAndFilterBar';

type PageKey = 'tasks' | 'events' | 'interests';

const DEFAULT_SORT: SortOption = 'deadline_asc';

export function useSortPreference(page: PageKey) {
  const [sort, setSortState] = useState<SortOption>(DEFAULT_SORT);
  const loaded = useRef(false);
  const userId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userId.current = user.id;
      const { data } = await supabase
        .from('user_preferences')
        .select('prefs')
        .eq('user_id', user.id)
        .maybeSingle();
      const prefs = (data?.prefs ?? {}) as Record<string, unknown>;
      const sortPrefs = (prefs.sort ?? {}) as Record<string, SortOption | undefined>;
      const saved = sortPrefs[page];
      if (saved && !cancelled) setSortState(saved);
      loaded.current = true;
    })();
    return () => { cancelled = true; };
  }, [page]);

  const setSort = (next: SortOption) => {
    setSortState(next);
    const uid = userId.current;
    if (!uid) return;
    (async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('prefs')
        .eq('user_id', uid)
        .maybeSingle();
      const prefs = ((data?.prefs ?? {}) as Record<string, unknown>);
      const sortPrefs = ((prefs.sort ?? {}) as Record<string, SortOption>);
      sortPrefs[page] = next;
      prefs.sort = sortPrefs;
      await supabase
        .from('user_preferences')
        .upsert([{ user_id: uid, prefs: prefs as never }], { onConflict: 'user_id' });
    })();
  };

  return [sort, setSort] as const;
}