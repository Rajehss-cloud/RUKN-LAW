// استبدل القيم ببيانات مشروع Supabase الخاص بك قبل النشر.
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let isValidSupabaseUrl = false;
try {
  const parsedUrl = new URL(SUPABASE_URL);
  isValidSupabaseUrl = parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
} catch {
  isValidSupabaseUrl = false;
}

const isConfigured =
  isValidSupabaseUrl &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
  Boolean(SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn("أضف رابط ومفتاح Supabase في js/supabase-config.js قبل استخدام الموقع.");
}

if (isConfigured && !window.supabase) {
  console.error("تعذر تحميل مكتبة Supabase من شبكة التوزيع.");
}

const supabaseClient = isConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

window.AppSupabase = supabaseClient;