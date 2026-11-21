# LEDGERFLOW // SAAS — Enterprise Revenue & Billing Operations Dashboard

[![CI](https://github.com/Nannidan/ledgerflow-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/Nannidan/ledgerflow-saas/actions)
**Live Demo:** [https://ledgerflow-saas-nine.vercel.app/](https://ledgerflow-saas-nine.vercel.app/)

High-clarity light-mode SaaS financial operations and billing workspace built with **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## Architecture & Engineering Decisions

- **Interactive Multi-Horizon Revenue Chart:** Dynamic `30D`, `90D`, and `12M` revenue-vs-target visualization with instant KPI recalculation (MRR, Net Dollar Retention, Pending AR, Churn).
- **Full Invoice Lifecycle CRUD & Slide-Over Inspector:** Searchable, status-filterable, and multi-column sortable invoice table backed by `localStorage` persistence and an accessible slide-over detail drawer.
- **Deterministic RFC-4180 CSV Export:** One-click client-side CSV serialization of the currently filtered invoice view for finance workflows.

## Local Development

```bash
npm install
npm run dev
npm run lint
npm run build
```
