// ─── Mock Data ────────────────────────────────────────────
// All monetary values in baisa (1 OMR = 1000 baisa)

export const currentUser = {
  id: 'usr_001',
  name: 'Ahmed Al-Balushi',
  email: 'ahmed.balushi@example.om',
  phone: '+968 9123 4567',
  avatar: null,
  initials: 'AB',
  role: 'customer',
  kycStatus: 'verified',
  joinedAt: '2024-01-15',
  nationalId: '****1234',
}

export const accounts = [
  {
    id: 'acc_001',
    bankName: 'Bank Muscat',
    bankCode: 'BMOM',
    accountNumber: '•••• •••• 8820',
    type: 'Current',
    currency: 'OMR',
    balance: 12840000, // baisa
    status: 'active',
    color: '#1e3a8a',
    isPrimary: true,
    iban: 'OM71 0601 0000 00012345678901',
    connectedAt: '2024-01-20',
  },
  {
    id: 'acc_002',
    bankName: 'National Bank of Oman',
    bankCode: 'NBOM',
    accountNumber: '•••• •••• 4412',
    type: 'Savings',
    currency: 'OMR',
    balance: 5350750, // baisa
    status: 'active',
    color: '#065f46',
    isPrimary: false,
    iban: 'OM71 0602 0000 00087654321098',
    connectedAt: '2024-02-10',
  },
  {
    id: 'acc_003',
    bankName: 'Ahli Bank',
    bankCode: 'ABOM',
    accountNumber: '•••• •••• 7731',
    type: 'Current',
    currency: 'OMR',
    balance: 2100000, // baisa
    status: 'active',
    color: '#7c3aed',
    isPrimary: false,
    iban: 'OM71 0603 0000 00011223344556',
    connectedAt: '2024-03-05',
  },
]

export const transactions = [
  { id: 'txn_001', date: '2025-01-15T10:23:00', description: 'Carrefour Hypermarket', category: 'Shopping', amount: -45500, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001234' },
  { id: 'txn_002', date: '2025-01-15T08:00:00', description: 'Monthly Salary', category: 'Income', amount: 800000, accountId: 'acc_001', type: 'credit', status: 'completed', reference: 'SAL0001' },
  { id: 'txn_003', date: '2025-01-14T15:45:00', description: 'Mawasalat Transport', category: 'Transport', amount: -2100, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001235' },
  { id: 'txn_004', date: '2025-01-14T12:30:00', description: 'Al Fairuz Restaurant', category: 'Dining', amount: -18750, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001236' },
  { id: 'txn_005', date: '2025-01-13T19:00:00', description: 'Electricity Bill (MEDC)', category: 'Utilities', amount: -32000, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'MEDC001' },
  { id: 'txn_006', date: '2025-01-13T11:15:00', description: 'Transfer from NBO', category: 'Transfer', amount: 150000, accountId: 'acc_001', type: 'credit', status: 'completed', reference: 'TRF001' },
  { id: 'txn_007', date: '2025-01-12T14:20:00', description: 'Muscat Pharmacy', category: 'Healthcare', amount: -8500, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001237' },
  { id: 'txn_008', date: '2025-01-12T09:45:00', description: 'Amazon.ae Purchase', category: 'Shopping', amount: -67200, accountId: 'acc_002', type: 'debit', status: 'completed', reference: 'AMZ001' },
  { id: 'txn_009', date: '2025-01-11T16:30:00', description: 'Petrol Station', category: 'Transport', amount: -15000, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001238' },
  { id: 'txn_010', date: '2025-01-11T10:00:00', description: 'Freelance Payment', category: 'Income', amount: 120000, accountId: 'acc_002', type: 'credit', status: 'completed', reference: 'FRE001' },
  { id: 'txn_011', date: '2025-01-10T13:15:00', description: 'Water Bill (MWREP)', category: 'Utilities', amount: -12500, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'MWREP001' },
  { id: 'txn_012', date: '2025-01-10T09:30:00', description: 'City Centre Muscat', category: 'Shopping', amount: -89000, accountId: 'acc_001', type: 'debit', status: 'pending', reference: 'REF001239' },
  { id: 'txn_013', date: '2025-01-09T17:45:00', description: 'Netflix Subscription', category: 'Entertainment', amount: -4999, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'NET001' },
  { id: 'txn_014', date: '2025-01-09T11:00:00', description: 'Rent Payment', category: 'Housing', amount: -250000, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'RENT001' },
  { id: 'txn_015', date: '2025-01-08T14:30:00', description: 'Interest Credit', category: 'Income', amount: 5250, accountId: 'acc_002', type: 'credit', status: 'completed', reference: 'INT001' },
]

export const beneficiaries = [
  { id: 'ben_001', name: 'Sara Al-Harthi', initials: 'SH', bankName: 'Oman Arab Bank', accountNumber: '•••• 5521', iban: 'OM71 0604 0000 00055555555501', type: 'domestic', isFavorite: true, lastTransfer: '2025-01-10' },
  { id: 'ben_002', name: 'Mohammed Al-Zadjali', initials: 'MZ', bankName: 'Bank Dhofar', accountNumber: '•••• 7732', iban: 'OM71 0605 0000 00077777777701', type: 'domestic', isFavorite: true, lastTransfer: '2025-01-08' },
  { id: 'ben_003', name: 'Khalid Al-Rashdi', initials: 'KR', bankName: 'NBO', accountNumber: '•••• 3344', iban: 'OM71 0602 0000 00033333333301', type: 'domestic', isFavorite: false, lastTransfer: '2024-12-20' },
  { id: 'ben_004', name: 'Ali Hassan (Dubai)', initials: 'AH', bankName: 'Emirates NBD', accountNumber: '•••• 9988', iban: 'AE07 0331 2345 6789 0123 456', type: 'international', isFavorite: false, lastTransfer: '2024-12-15' },
]

export const notifications = [
  { id: 'ntf_001', type: 'transaction', title: 'Payment Received', message: 'OMR 800.000 salary credited to your Bank Muscat account.', time: '2025-01-15T08:05:00', read: false },
  { id: 'ntf_002', type: 'security', title: 'New Login Detected', message: 'A new login from Chrome on MacOS was detected. If this wasn\'t you, secure your account.', time: '2025-01-14T22:30:00', read: false },
  { id: 'ntf_003', type: 'transaction', title: 'Payment Successful', message: 'Transfer of OMR 45.500 to Carrefour completed successfully.', time: '2025-01-14T10:25:00', read: true },
  { id: 'ntf_004', type: 'kyc', title: 'Identity Verified', message: 'Your KYC verification is complete. All features are now available.', time: '2025-01-13T09:00:00', read: true },
  { id: 'ntf_005', type: 'transaction', title: 'Bank Sync Complete', message: 'Your National Bank of Oman account has been refreshed with the latest transactions.', time: '2025-01-12T12:00:00', read: true },
]

export const spendingData = [
  { month: 'Aug', income: 800000, expenses: 412000 },
  { month: 'Sep', income: 800000, expenses: 389000 },
  { month: 'Oct', income: 920000, expenses: 501000 },
  { month: 'Nov', income: 800000, expenses: 445000 },
  { month: 'Dec', income: 800000, expenses: 623000 },
  { month: 'Jan', income: 920000, expenses: 543750 },
]

export const categoryData = [
  { name: 'Housing', value: 250000, color: '#1e3a8a' },
  { name: 'Shopping', value: 201700, color: '#3b82f6' },
  { name: 'Transport', value: 32100, color: '#0ea5e9' },
  { name: 'Utilities', value: 44500, color: '#06b6d4' },
  { name: 'Dining', value: 18750, color: '#6366f1' },
  { name: 'Healthcare', value: 8500, color: '#8b5cf6' },
  { name: 'Entertainment', value: 4999, color: '#a78bfa' },
]

export const availableBanks = [
  { id: 'bmom', name: 'Bank Muscat', code: 'BMOM', logo: 'BM', color: '#1e3a8a' },
  { id: 'nbom', name: 'National Bank of Oman', code: 'NBOM', logo: 'NBO', color: '#065f46' },
  { id: 'abom', name: 'Ahli Bank', code: 'ABOM', logo: 'AB', color: '#7c3aed' },
  { id: 'oab', name: 'Oman Arab Bank', code: 'OAB', logo: 'OAB', color: '#d97706' },
  { id: 'bdo', name: 'Bank Dhofar', code: 'BDO', logo: 'BD', color: '#059669' },
  { id: 'hsbc', name: 'HSBC Oman', code: 'HSBC', logo: 'HSBC', color: '#dc2626' },
  { id: 'sohar', name: 'Sohar International', code: 'SIB', logo: 'SI', color: '#0369a1' },
]

export const adminStats = {
  totalUsers: 12847,
  activeUsers: 10234,
  pendingKyc: 234,
  totalTransactions: 89234,
  transactionVolume: 45670000000, // baisa
  flaggedTransactions: 12,
}

export const adminCustomers = [
  { id: 'cust_001', name: 'Ahmed Al-Balushi', email: 'ahmed@example.om', joinedAt: '2024-01-15', kycStatus: 'verified', status: 'active', accounts: 3 },
  { id: 'cust_002', name: 'Sara Al-Harthi', email: 'sara@example.om', joinedAt: '2024-01-18', kycStatus: 'pending', status: 'active', accounts: 1 },
  { id: 'cust_003', name: 'Mohammed Al-Zadjali', email: 'moh@example.om', joinedAt: '2024-02-03', kycStatus: 'verified', status: 'active', accounts: 2 },
  { id: 'cust_004', name: 'Khalid Al-Rashdi', email: 'khalid@example.om', joinedAt: '2024-02-15', kycStatus: 'rejected', status: 'suspended', accounts: 0 },
  { id: 'cust_005', name: 'Fatima Al-Balushi', email: 'fatima@example.om', joinedAt: '2024-03-01', kycStatus: 'verified', status: 'active', accounts: 1 },
]
