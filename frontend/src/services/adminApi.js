const API_URL = '/api/v1/admin';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function wrapResponse(json) {
  const data = json.data || [];
  const meta = json.meta || {};
  // If data is an array, attach meta & data so both array iteration and { data, meta } destructuring work seamlessly
  if (Array.isArray(data)) {
    data.data = data;
    data.meta = meta;
    return data;
  }
  return { data, meta };
}

export const adminApi = {
  getUsers: async (params = {}) => {
    const res = await fetch(`${API_URL}/users${buildQuery(params)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return wrapResponse(await res.json());
  },

  getUserDetails: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch customer profile');
    return (await res.json()).data;
  },

  updateUserStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update customer status');
    }
    return (await res.json()).data;
  },

  getPayments: async (params = {}) => {
    const res = await fetch(`${API_URL}/payments${buildQuery(params)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return wrapResponse(await res.json());
  },

  getAudits: async (params = {}) => {
    const res = await fetch(`${API_URL}/audits${buildQuery(params)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch audits');
    return wrapResponse(await res.json());
  },

  getPendingLoanReviews: async (params = {}) => {
    const res = await fetch(`${API_URL}/loans/reviews${buildQuery(params)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch pending loan reviews');
    return wrapResponse(await res.json());
  },

  approveLoanApplication: async (id, adminNotes = '', options = {}) => {
    const res = await fetch(`${API_URL}/loans/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        adminNotes,
        customInterestRateBps: options.customInterestRateBps,
        customApprovedAmountCents: options.customApprovedAmountCents,
        customTenureMonths: options.customTenureMonths,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve loan application');
    }
    return (await res.json()).data;
  },

  rejectLoanApplication: async (id, rejectionReason = '', adminNotes = '') => {
    const res = await fetch(`${API_URL}/loans/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rejectionReason, adminNotes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reject loan application');
    }
    return (await res.json()).data;
  },
};
