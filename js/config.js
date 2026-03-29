// =============================================
// js/config.js — Configurazione Supabase
// =============================================
// ISTRUZIONI:
// 1. Vai su https://supabase.com e crea un progetto gratuito
// 2. In "Project Settings > API" copia URL e anon key
// 3. Sostituisci i valori qui sotto

const SUPABASE_URL = 'https://bhgvhvjkcengqxekelqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_38dUw5SNVaipzHfWeFVEAQ_B09FqOZE';

// Inizializza client Supabase (caricato via CDN in index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
