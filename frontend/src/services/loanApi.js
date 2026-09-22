const API_URL = '/api/v1/loans';

export const loanApi = {
  checkEligibility: async (payload) => {
    const res = await fetch(`${API_URL}/eligibility/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to check eligibility');
    return (await res.json()).data;
  },

  createApplication: async (payload) => {
    const res = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create application');
    return (await res.json()).data;
  },

  getApplications: async () => {
    const res = await fetch(`${API_URL}/applications`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return (await res.json()).data;
  },

  getApplicationById: async (id) => {
    const res = await fetch(`${API_URL}/applications/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch application details');
    return (await res.json()).data;
  },

  updateDraft: async (id, payload) => {
    const res = await fetch(`${API_URL}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update draft');
    return (await res.json()).data;
  },

  submitApplication: async (id) => {
    const res = await fetch(`${API_URL}/applications/${id}/submit`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit application');
    }
    return (await res.json()).data;
  },

  setupOfferAutopay: async (id, offerId) => {
    const res = await fetch(`${API_URL}/applications/${id}/offers/${offerId}/setup-autopay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initiate AutoPay mandate setup');
    }
    return (await res.json()).data;
  },

  acceptOffer: async (id, offerId, options = {}) => {
    const consentId = typeof options === 'string' ? options : (options?.consentId || options?.consent_id);
    const res = await fetch(`${API_URL}/applications/${id}/accept-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offerId, consent_id: consentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to accept loan offer');
    }
    return (await res.json()).data;
  },

  getLoanSchedule: async (id) => {
    const res = await fetch(`${API_URL}/${id}/schedule`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch loan schedule');
    return (await res.json()).data;
  },

  setupAutopay: async (id, payload) => {
    const res = await fetch(`${API_URL}/${id}/autopay/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to set up AutoPay');
    return (await res.json()).data;
  },

  activateAutopay: async (id, consentId) => {
    const res = await fetch(`${API_URL}/${id}/autopay/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ consentId }),
    });
    if (!res.ok) throw new Error('Failed to activate AutoPay');
    return (await res.json()).data;
  },

  revokeAutopay: async (id) => {
    const res = await fetch(`${API_URL}/${id}/autopay/revoke`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to revoke AutoPay');
    return await res.json();
  },

  initiateManualPayment: async (id, payload) => {
    const res = await fetch(`${API_URL}/${id}/payments/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to initiate payment');
    return (await res.json()).data;
  }
};
