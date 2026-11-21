export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';
export type TimeRange = '30D' | '90D' | '12M';

export interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  client: string;
  email: string;
  plan: 'Enterprise' | 'Growth' | 'Scale';
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paymentMethod: string;
  lineItems: LineItem[];
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  target: number;
}

export const REVENUE_SERIES: Record<TimeRange, RevenuePoint[]> = {
  '30D': [
    { label: 'Wk 1', revenue: 28400, target: 26000 },
    { label: 'Wk 2', revenue: 31200, target: 28000 },
    { label: 'Wk 3', revenue: 29800, target: 30000 },
    { label: 'Wk 4', revenue: 36900, target: 32000 }
  ],
  '90D': [
    { label: 'Sep', revenue: 94200, target: 90000 },
    { label: 'Oct', revenue: 108600, target: 100000 },
    { label: 'Nov', revenue: 126300, target: 112000 }
  ],
  '12M': [
    { label: 'Dec', revenue: 64000, target: 62000 },
    { label: 'Jan', revenue: 69500, target: 66000 },
    { label: 'Feb', revenue: 73200, target: 70000 },
    { label: 'Mar', revenue: 79400, target: 74000 },
    { label: 'Apr', revenue: 82100, target: 78000 },
    { label: 'May', revenue: 88900, target: 82000 },
    { label: 'Jun', revenue: 91400, target: 86000 },
    { label: 'Jul', revenue: 95800, target: 90000 },
    { label: 'Aug', revenue: 101200, target: 94000 },
    { label: 'Sep', revenue: 108400, target: 98000 },
    { label: 'Oct', revenue: 117900, target: 106000 },
    { label: 'Nov', revenue: 126300, target: 112000 }
  ]
};

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2048',
    client: 'Northstar Logistics',
    email: 'ap@northstarlogistics.io',
    plan: 'Enterprise',
    amount: 14800,
    status: 'Paid',
    issuedDate: '2026-11-18',
    dueDate: '2026-12-02',
    paymentMethod: 'ACH Transfer ···· 4821',
    lineItems: [
      { description: 'Enterprise Platform License (Annual Seat Pack)', qty: 1, unitPrice: 12000 },
      { description: 'Dedicated Audit Log Retention', qty: 1, unitPrice: 2800 }
    ]
  },
  {
    id: 'INV-2047',
    client: 'Verve Health Systems',
    email: 'billing@vervehealth.com',
    plan: 'Enterprise',
    amount: 18500,
    status: 'Pending',
    issuedDate: '2026-11-16',
    dueDate: '2026-11-30',
    paymentMethod: 'Wire Transfer ···· 9012',
    lineItems: [
      { description: 'Enterprise Core Workspace (50 Seats)', qty: 1, unitPrice: 15000 },
      { description: 'HIPAA BAA & SSO Module', qty: 1, unitPrice: 3500 }
    ]
  },
  {
    id: 'INV-2046',
    client: 'Meridian Analytics',
    email: 'finance@meridian.co',
    plan: 'Scale',
    amount: 6400,
    status: 'Paid',
    issuedDate: '2026-11-14',
    dueDate: '2026-11-28',
    paymentMethod: 'Visa Corporate ···· 3119',
    lineItems: [
      { description: 'Scale Tier Subscription', qty: 1, unitPrice: 5200 },
      { description: 'API Overages (1.2M calls)', qty: 1, unitPrice: 1200 }
    ]
  },
  {
    id: 'INV-2045',
    client: 'Kestrel Robotics',
    email: 'accounts@kestrelrobotics.ai',
    plan: 'Scale',
    amount: 9250,
    status: 'Overdue',
    issuedDate: '2026-10-29',
    dueDate: '2026-11-12',
    paymentMethod: 'ACH Transfer ···· 7740',
    lineItems: [
      { description: 'Scale Tier Subscription', qty: 1, unitPrice: 6500 },
      { description: 'Priority Onboarding & Migration', qty: 1, unitPrice: 2750 }
    ]
  },
  {
    id: 'INV-2044',
    client: 'Clearwater Capital',
    email: 'ops@clearwatercap.com',
    plan: 'Enterprise',
    amount: 22400,
    status: 'Paid',
    issuedDate: '2026-11-10',
    dueDate: '2026-11-24',
    paymentMethod: 'Wire Transfer ···· 1108',
    lineItems: [
      { description: 'Enterprise Multi-Region Cluster', qty: 1, unitPrice: 19400 },
      { description: 'Custom Role Permissions Pack', qty: 1, unitPrice: 3000 }
    ]
  },
  {
    id: 'INV-2043',
    client: 'Loomis Architecture',
    email: 'admin@loomisarch.ca',
    plan: 'Growth',
    amount: 3200,
    status: 'Pending',
    issuedDate: '2026-11-08',
    dueDate: '2026-11-22',
    paymentMethod: 'Mastercard ···· 6420',
    lineItems: [
      { description: 'Growth Plan (20 Seats)', qty: 1, unitPrice: 3200 }
    ]
  },
  {
    id: 'INV-2042',
    client: 'Boreal Cloud Labs',
    email: 'invoices@borealcloud.dev',
    plan: 'Growth',
    amount: 4750,
    status: 'Overdue',
    issuedDate: '2026-10-21',
    dueDate: '2026-11-04',
    paymentMethod: 'Visa Corporate ···· 5502',
    lineItems: [
      { description: 'Growth Plan + CI Telemetry Add-on', qty: 1, unitPrice: 4750 }
    ]
  },
  {
    id: 'INV-2041',
    client: 'Harborview Retail Group',
    email: 'billing@harborviewretail.com',
    plan: 'Scale',
    amount: 8900,
    status: 'Paid',
    issuedDate: '2026-11-02',
    dueDate: '2026-11-16',
    paymentMethod: 'ACH Transfer ···· 2093',
    lineItems: [
      { description: 'Scale Tier Subscription', qty: 1, unitPrice: 7400 },
      { description: 'POS Webhook Connector', qty: 1, unitPrice: 1500 }
    ]
  }
];
