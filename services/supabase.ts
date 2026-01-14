
import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase
const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';

// Chave ANON PUBLIC (JWT) fornecida pelo usuário
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
