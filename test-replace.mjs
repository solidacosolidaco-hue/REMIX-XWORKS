const rawUrl = 'https://sfkwyoeykanynywkptnx.supabase.co/rest/v1/';
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
console.log(SUPABASE_URL);
