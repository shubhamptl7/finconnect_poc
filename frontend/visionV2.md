# PayOman Frontend Design Context v2

> **Purpose:** This document provides complete product and UI/UX context
> for AI coding assistants (Antigravity IDE, Cursor, Claude Code,
> Windsurf, GitHub Copilot) to design only the **frontend** of the
> PayOman application.

------------------------------------------------------------------------

# Project Overview

PayOman is a modern **Open Banking financial platform** designed for the
Sultanate of Oman. It is **not a digital bank** and **does not replace
existing banks**. Instead, it acts as a secure financial hub that
connects users to their existing bank accounts through Open Banking
principles.

The current phase is a **Proof of Concept (POC)**. The frontend should
demonstrate a premium, production-quality user experience while using
sandbox or prototype integrations behind the scenes.

The objective of the frontend is to communicate:

-   Trust
-   Security
-   Simplicity
-   Transparency
-   Premium quality
-   Modern financial technology

------------------------------------------------------------------------

# Product Identity

PayOman is an **Open Banking Platform**.

Banks continue to: - Hold customer money - Execute transactions -
Maintain account records

PayOman provides: - Unified financial dashboard - Connected bank
management - Account aggregation - Transaction history - Beneficiary
management - Payment initiation - Financial insights - Secure user
experience

Think of the product as a **Financial Operating System**, not a banking
website.

------------------------------------------------------------------------

# Target Users

-   Omani citizens
-   Salaried professionals
-   Business owners
-   Students
-   Individuals with multiple bank accounts

The UI must be understandable by non-technical users.

------------------------------------------------------------------------

# Industry

Primary: - Open Banking

Secondary: - Financial Aggregation - Personal Finance - Payment
Platform - Financial Dashboard

------------------------------------------------------------------------

# UX Goals

The application should make users feel:

-   My money is safe.
-   I understand what is happening.
-   My banks remain in control.
-   I have complete visibility over my finances.
-   I can perform tasks quickly.

------------------------------------------------------------------------

# Brand Personality

-   Professional
-   Calm
-   Trustworthy
-   Premium
-   Clean
-   Modern
-   Confident

Avoid gaming-style visuals, excessive gradients, loud colors or clutter.

------------------------------------------------------------------------

# Visual Direction

Inspiration (do not copy):

-   Revolut
-   Monzo
-   Wise
-   Mercury
-   Nubank
-   Ramp
-   Brex
-   Stripe Dashboard (Admin UX)

Use: - Large whitespace - Soft shadows - Rounded cards - Premium
typography - Consistent spacing - Subtle motion - Accessible colors

------------------------------------------------------------------------

# Primary User Journey

Landing Page

↓

Create Account

↓

Login

↓

Identity Verification (Prototype)

↓

Complete Onboarding

↓

Connect Bank

↓

Grant Consent

↓

Accounts Imported

↓

Dashboard

↓

View Accounts

↓

View Transactions

↓

Manage Beneficiaries

↓

Initiate Payment

↓

Payment Status

↓

Notifications

↓

Settings

------------------------------------------------------------------------

# Core Customer Screens

Public: - Landing - About - Features - FAQ - Contact - Authentication

Authenticated: - Dashboard - Connected Banks - Connected Accounts -
Transactions - Payments - Beneficiaries - Notifications - Activity -
Insights - Profile - Settings - Help

Admin: - Dashboard - User Management - KYC Review - Payment Monitoring -
Reports - Audit Logs - System Settings

------------------------------------------------------------------------

# Dashboard Philosophy

The dashboard should immediately answer:

1.  Which banks are connected?
2.  What is my total financial position?
3.  What changed recently?
4.  Are there pending actions?
5.  What can I do next?

Priority layout:

1.  Total Balance
2.  Connected Banks
3.  Recent Transactions
4.  Quick Actions
5.  Spending Insights
6.  Notifications

------------------------------------------------------------------------

# Connected Banks Screen

Display:

-   Bank logo
-   Connection status
-   Last sync time
-   Connected accounts
-   Permissions granted
-   Reconnect
-   Disconnect

This is one of the most important screens.

------------------------------------------------------------------------

# Consent Management Screen

Show:

-   Connected bank
-   Granted permissions
-   Date granted
-   Expiry (if applicable)
-   Revoke access
-   Refresh connection

Transparency builds trust.

------------------------------------------------------------------------

# Design System

Components should be reusable:

-   Buttons
-   Cards
-   Inputs
-   Tables
-   Charts
-   Status badges
-   Timeline
-   Stepper
-   File upload
-   Bank cards
-   Account cards
-   Beneficiary cards
-   Empty states
-   Error states
-   Loading skeletons
-   Toasts
-   Dialogs
-   Drawers

------------------------------------------------------------------------

# Forms

Use multi-step onboarding.

Keep forms short.

Inline validation.

Clear helper text.

Never overwhelm users.

------------------------------------------------------------------------

# Mobile Strategy

Desktop-first.

Fully responsive.

Mobile layouts should be intentionally designed, not compressed desktop
pages.

------------------------------------------------------------------------

# Accessibility

Support:

-   Keyboard navigation
-   Focus states
-   Screen readers
-   Proper contrast
-   Large touch targets

------------------------------------------------------------------------

# Frontend Constraints

Do NOT expose backend complexity.

Frontend should assume APIs exist.

Design around clean service interfaces.

Do not hardcode Oman-specific APIs into UI logic.

------------------------------------------------------------------------

# AI Instructions

When generating frontend:

-   Prefer reusable components.
-   Use a scalable folder structure.
-   Create production-quality layouts.
-   Prioritize UX over flashy visuals.
-   Keep design consistent.
-   Follow modern SaaS and fintech design standards.
-   Design as if this product will become a real commercial Open Banking
    platform.

The frontend should look investor-ready, client-ready and
production-ready even though backend integrations are still in the POC
phase.