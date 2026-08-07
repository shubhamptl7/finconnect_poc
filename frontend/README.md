# PayOman – Frontend

Premium fintech frontend for the Sultanate of Oman.

## Stack
- React 18 + Vite 5
- Tailwind CSS 3
- Framer Motion (animations)
- Recharts (data visualisation)
- React Router 6
- Lucide React (icons)

## Folder Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI primitives (Button, Card, Modal, Badge…)
│   └── layout/       # AppLayout, Sidebar, TopBar
├── pages/
│   ├── auth/         # Login, Register, ForgotPassword, KYC
│   ├── dashboard/    # Dashboard, Accounts, Transactions, Payments, Beneficiaries, Cards, Settings…
│   └── admin/        # Admin layout + Dashboard, Customers, KYC Review, System Health
├── store/
│   ├── AppContext.jsx # Global state (auth, toasts, notifications)
│   └── mockData.js   # Mock API data (all OMR values in baisa)
├── lib/
│   └── utils.js      # formatCurrency, formatDate, cn, sleep…
└── index.css         # Design tokens + global styles + Tailwind layers
```

## Pages Included
### Public
- `/` — Landing page (Hero, Features, Pricing, Security, CTA, Footer)
- `/auth/login` — Login
- `/auth/register` — Multi-step registration
- `/auth/forgot-password` — Password reset
- `/auth/verify-kyc` — KYC verification flow

### Customer App (protected)
- `/app/dashboard` — Balance overview, cash flow chart, category breakdown, recent transactions
- `/app/accounts` — Bank card UI, account details, connect bank modal
- `/app/transactions` — Searchable, filterable, paginated transaction table
- `/app/payments` — 3-step transfer flow (select → review → confirm)
- `/app/beneficiaries` — Saved recipients with add/remove/favourite
- `/app/cards` — Virtual card, freeze/unfreeze, spending limits, controls
- `/app/settings` — Profile, Security, Notifications tabs
- `/app/notifications` — Notification centre
- `/app/help` — FAQ, Live chat, Phone, Submit ticket

### Admin Panel
- `/admin` — Dashboard (stats, volume charts, recent users)
- `/admin/customers` — Customer management table with search
- `/admin/kyc` — KYC review queue (approve/reject)
- `/admin/system` — Service status and health metrics

## Quick Start
```bash
npm install
npm run dev
```
Runs on http://localhost:5173

## Notes
- Sign in with any email/password to access the app (mock auth)
- All monetary values stored as integers in baisa (1 OMR = 1000 baisa)
- No backend required — all data is mocked in `src/store/mockData.js`
