const API_URL = '/api/v1/admin';

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
  },
  getPendingLoanReviews: async () => {
    const res = await fetch(`${API_URL}/loans/reviews`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch pending loan reviews');
    return (await res.json()).data;
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
