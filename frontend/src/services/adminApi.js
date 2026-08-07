const API_URL = 'http://localhost:3000/api/v1/admin';

export const adminApi = {
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return (await res.json()).data;
  },
  getPayments: async () => {
    const res = await fetch(`${API_URL}/payments`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return (await res.json()).data;
  },
  getAudits: async () => {
    const res = await fetch(`${API_URL}/audits`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch audits');
    return (await res.json()).data;
  }
};
