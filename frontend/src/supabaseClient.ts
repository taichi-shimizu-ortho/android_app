import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfuklmuilcejinkzfimq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yB7PtClaSDoX7S074E1wLA_KoEpg5uN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
