const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function query(table, options = {}) {
  if (!URL || !KEY) return [];
  const { method = 'GET', body, params = '' } = options;
  const res = await fetch(`${URL}/rest/v1/${table}${params}`, {
    method,
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) return [];
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

export const supabase = {
  async users()    { return query('users', { params: '?order=joined.desc' }); },
  async pending()  { return query('pending', { params: '?order=created_at.desc' }); },
  async messages() { return query('messages', { params: '?order=date.desc' }); },
  async settings() {
    const d = await query('settings', { params: '?id=eq.1' });
    return d[0] || null;
  },
  async addUser(u)    { return query('users', { method:'POST', body:u }); },
  async updateUser(u) {
    const { id, ...rest } = u;
    return query(`users?id=eq.${id}`, { method:'PATCH', body:rest });
  },
  async addPending(u)    { return query('pending', { method:'POST', body:u }); },
  async deletePending(id){ return query(`pending?id=eq.${id}`, { method:'DELETE' }); },
  async addMessage(m)    { return query('messages', { method:'POST', body:m }); },
  async markRead(id)     { return query(`messages?id=eq.${id}`, { method:'PATCH', body:{ read:true } }); },
  async deleteMessage(id){ return query(`messages?id=eq.${id}`, { method:'DELETE' }); },
  async saveSettings(s)  {
    return query('settings?id=eq.1', { method:'PATCH', body:s });
  },
  async incrViews(id) {
    const users = await query(`users?id=eq.${id}`, { params:'' });
    if (users[0]) await query(`users?id=eq.${id}`, { method:'PATCH', body:{ views:(users[0].views||0)+1 } });
  },
  async updSparks(id, delta) {
    const users = await query(`users?id=eq.${id}`, { params:'' });
    if (users[0]) await query(`users?id=eq.${id}`, { method:'PATCH', body:{ sparks:Math.max(0,(users[0].sparks||0)+delta) } });
  },
};
