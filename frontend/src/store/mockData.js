// ─── Mock Data ────────────────────────────────────────────
// All monetary values in GBP standard units or pence where specified

export const currentUser = {
  id: 'usr_001',
  name: 'Ahmed Al-Balushi',
  email: 'ahmed.balushi@example.om',
  phone: '+44 7700 900123',
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
    bankName: 'Barclays Bank UK',
    bankCode: 'BARC',
    accountNumber: '•••• •••• 8820',
    type: 'Current',
    currency: 'GBP',
    balance: 12840,
    available_balance: 12840,
    current_balance: 12840,
    status: 'active',
    color: '#1e3a8a',
    isPrimary: true,
    sort_code: '20-00-00',
    bacs_account: '55778820',
    iban: 'GB29 BARC 2000 0055 7788 20',
    connectedAt: '2024-01-20',
  },
  {
    id: 'acc_002',
    bankName: 'HSBC UK',
    bankCode: 'HSBC',
    accountNumber: '•••• •••• 4412',
    type: 'Savings',
    currency: 'GBP',
    balance: 5350.75,
    available_balance: 5350.75,
    current_balance: 5350.75,
    status: 'active',
    color: '#065f46',
    isPrimary: false,
    sort_code: '40-05-15',
    bacs_account: '44112233',
    iban: 'GB29 HSBC 4005 1544 1122 33',
    connectedAt: '2024-02-10',
  },
  {
    id: 'acc_003',
    bankName: 'Lloyds Bank',
    bankCode: 'LOYD',
    accountNumber: '•••• •••• 7731',
    type: 'Current',
    currency: 'GBP',
    balance: 2100,
    available_balance: 2100,
    current_balance: 2100,
    status: 'active',
    color: '#7c3aed',
    isPrimary: false,
    sort_code: '30-90-89',
    bacs_account: '88773311',
    iban: 'GB29 LOYD 3090 8988 7733 11',
    connectedAt: '2024-03-05',
  },
]

export const transactions = [
  { id: 'txn_001', date: '2025-01-15T10:23:00', description: 'Tesco Superstore', category: 'Shopping', amount: -45.50, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001234' },
  { id: 'txn_002', date: '2025-01-15T08:00:00', description: 'Monthly Salary', category: 'Income', amount: 3500.00, accountId: 'acc_001', type: 'credit', status: 'completed', reference: 'SAL0001' },
  { id: 'txn_003', date: '2025-01-14T15:45:00', description: 'TFL Travel Charge', category: 'Transport', amount: -5.20, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001235' },
  { id: 'txn_004', date: '2025-01-14T12:30:00', description: 'Nando\'s Restaurant', category: 'Dining', amount: -28.75, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001236' },
  { id: 'txn_005', date: '2025-01-13T19:00:00', description: 'British Gas Energy', category: 'Utilities', amount: -120.00, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'BGAS001' },
  { id: 'txn_006', date: '2025-01-13T11:15:00', description: 'Transfer from HSBC', category: 'Transfer', amount: 500.00, accountId: 'acc_001', type: 'credit', status: 'completed', reference: 'TRF001' },
  { id: 'txn_007', date: '2025-01-12T14:20:00', description: 'Boots Pharmacy', category: 'Healthcare', amount: -18.50, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001237' },
  { id: 'txn_008', date: '2025-01-12T09:45:00', description: 'Amazon.co.uk Purchase', category: 'Shopping', amount: -67.20, accountId: 'acc_002', type: 'debit', status: 'completed', reference: 'AMZ001' },
  { id: 'txn_009', date: '2025-01-11T16:30:00', description: 'Shell Petrol Station', category: 'Transport', amount: -55.00, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'REF001238' },
  { id: 'txn_010', date: '2025-01-11T10:00:00', description: 'Freelance Payment', category: 'Income', amount: 850.00, accountId: 'acc_002', type: 'credit', status: 'completed', reference: 'FRE001' },
  { id: 'txn_011', date: '2025-01-10T13:15:00', description: 'Thames Water', category: 'Utilities', amount: -35.00, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'TWR001' },
  { id: 'txn_012', date: '2025-01-10T09:30:00', description: 'John Lewis London', category: 'Shopping', amount: -189.00, accountId: 'acc_001', type: 'debit', status: 'pending', reference: 'REF001239' },
  { id: 'txn_013', date: '2025-01-09T17:45:00', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'NET001' },
  { id: 'txn_014', date: '2025-01-09T11:00:00', description: 'Rent Payment', category: 'Housing', amount: -1250.00, accountId: 'acc_001', type: 'debit', status: 'completed', reference: 'RENT001' },
  { id: 'txn_015', date: '2025-01-08T14:30:00', description: 'Interest Credit', category: 'Income', amount: 15.25, accountId: 'acc_002', type: 'credit', status: 'completed', reference: 'INT001' },
]

export const beneficiaries = [
  { id: 'ben_001', name: 'Sara Al-Harthi', initials: 'SH', bankName: 'Barclays Bank', accountNumber: '•••• 5521', sort_code: '20-00-00', bacs_account: '55555501', iban: 'GB29 BARC 2000 0055 5555 01', type: 'domestic', isFavorite: true, lastTransfer: '2025-01-10' },
  { id: 'ben_002', name: 'Mohammed Al-Zadjali', initials: 'MZ', bankName: 'HSBC Bank UK', accountNumber: '•••• 7732', sort_code: '40-05-15', bacs_account: '77777701', iban: 'GB29 HSBC 4005 1577 7777 01', type: 'domestic', isFavorite: true, lastTransfer: '2025-01-08' },
  { id: 'ben_003', name: 'Khalid Al-Rashdi', initials: 'KR', bankName: 'Lloyds Bank', accountNumber: '•••• 3344', sort_code: '30-90-89', bacs_account: '33333301', iban: 'GB29 LOYD 3090 8933 3333 01', type: 'domestic', isFavorite: false, lastTransfer: '2024-12-20' },
  { id: 'ben_004', name: 'Ali Hassan', initials: 'AH', bankName: 'Monzo Bank', accountNumber: '•••• 9988', sort_code: '04-00-04', bacs_account: '99887766', iban: 'GB29 MONZ 0400 0499 8877 66', type: 'domestic', isFavorite: false, lastTransfer: '2024-12-15' },
]

export const notifications = [
  { id: 'ntf_001', type: 'transaction', title: 'Payment Received', message: '£3,500.00 salary credited to your Barclays account.', time: '2025-01-15T08:05:00', read: false },
  { id: 'ntf_002', type: 'security', title: 'New Login Detected', message: 'A new login from Chrome on MacOS was detected. If this wasn\'t you, secure your account.', time: '2025-01-14T22:30:00', read: false },
  { id: 'ntf_003', type: 'transaction', title: 'Payment Successful', message: 'Transfer of £45.50 to Tesco completed successfully.', time: '2025-01-14T10:25:00', read: true },
  { id: 'ntf_004', type: 'kyc', title: 'Identity Verified', message: 'Your KYC verification is complete. All features are now available.', time: '2025-01-13T09:00:00', read: true },
  { id: 'ntf_005', type: 'transaction', title: 'Bank Sync Complete', message: 'Your HSBC account has been refreshed with the latest transactions.', time: '2025-01-12T12:00:00', read: true },
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
  { name: 'Housing', value: 250000, color: '#064E3B' },
  { name: 'Shopping', value: 201700, color: '#0F766E' },
  { name: 'Transport', value: 32100, color: '#10B981' },
  { name: 'Utilities', value: 44500, color: '#059669' },
  { name: 'Dining', value: 18750, color: '#34D399' },
  { name: 'Healthcare', value: 8500, color: '#0B625C' },
  { name: 'Entertainment', value: 4999, color: '#065F46' },
]

export const availableBanks = [
  { id: 'barclays', name: 'Barclays Bank', code: 'BARC', logo: 'BAR', color: '#0072CE' },
  { id: 'lloyds', name: 'Lloyds Bank', code: 'LLOY', logo: 'LLOY', color: '#065f46' },
  { id: 'hsbc', name: 'HSBC UK', code: 'HSBC', logo: 'HSBC', color: '#dc2626' },
  { id: 'natwest', name: 'NatWest', code: 'NWST', logo: 'NW', color: '#5A2D81' },
  { id: 'santander', name: 'Santander UK', code: 'SAN', logo: 'SAN', color: '#EC0000' },
  { id: 'monzo', name: 'Monzo Bank', code: 'MONZ', logo: 'MZ', color: '#FF3366' },
  { id: 'starling', name: 'Starling Bank', code: 'STAR', logo: 'ST', color: '#0F766E' },
]

export const adminStats = {
  totalUsers: 12847,
  activeUsers: 12847,
  pendingKyc: 0,
  totalTransactions: 89234,
  transactionVolume: 45670000000, // baisa
  flaggedTransactions: 12,
}

export const adminCustomers = [
  { id: 'cust_001', name: 'Ahmed Al-Balushi', email: 'ahmed@example.om', joinedAt: '2024-01-15', kycStatus: 'verified', status: 'active', accounts: 3 },
  { id: 'cust_002', name: 'Sara Al-Harthi', email: 'sara@example.om', joinedAt: '2024-01-18', kycStatus: 'verified', status: 'active', accounts: 1 },
  { id: 'cust_003', name: 'Mohammed Al-Zadjali', email: 'moh@example.om', joinedAt: '2024-02-03', kycStatus: 'verified', status: 'active', accounts: 2 },
  { id: 'cust_004', name: 'Khalid Al-Rashdi', email: 'khalid@example.om', joinedAt: '2024-02-15', kycStatus: 'verified', status: 'active', accounts: 1 },
  { id: 'cust_005', name: 'Fatima Al-Balushi', email: 'fatima@example.om', joinedAt: '2024-03-01', kycStatus: 'verified', status: 'verified', status: 'active', accounts: 1 },
]
