# FinConnect – Backend Project Context

## AI Development Context (Version 1.0)

## Project Overview

FinConnect is an **Open Banking financial platform** designed for the Sultanate of Oman.

It is **not a digital bank**, **not a wallet**, and **not a payment gateway**.

Its primary purpose is to become a secure financial platform that allows users to connect their existing bank accounts, view financial information, manage beneficiaries, and initiate supported payments through one unified application.

The current project phase is a **Proof of Concept (POC)**.

The objective of this POC is to demonstrate the complete product architecture, backend design, business workflows, and user experience. Production integrations with Omani banking infrastructure are intentionally postponed.

---

# Current Project Scope

The backend should support the following business modules:

- Authentication
- User Management
- Identity Verification (Prototype)
- KYC Workflow (Prototype)
- Bank Connection
- Connected Accounts
- Transaction History
- Beneficiaries
- Payments
- Notifications
- Audit Logs
- Admin Portal

Every module should be designed as if it will eventually be connected to real production services.

---

# POC Constraints

The following production integrations are **NOT AVAILABLE** during development:

- Direct Omani Bank APIs
- THEQA
- National eKYC
- Government APIs
- Production payment rails
- Production banking credentials

Therefore, the architecture **must never depend directly on these providers**.

Instead, use provider interfaces so that production integrations can be added later without changing business logic.

---

# Product Philosophy

Banks continue to:

- Authenticate users
- Store money
- Execute financial transactions
- Maintain account records

FinConnect provides:

- Financial aggregation
- Unified dashboard
- Account management
- Payment orchestration
- Beneficiary management
- User experience
- Financial insights

The application sits **above banks**, not instead of banks.

---

# Selected Architecture

Architecture Style:

**Modular Monolith**

Reason:

- Small engineering team
- Faster development
- Easier maintenance
- Simpler deployment
- Easy migration to microservices later if required

---

# Backend Modules

## Authentication

Responsibilities:

- Registration
- Login
- JWT Authentication
- Refresh Tokens
- Roles & Permissions
- Session Management

---

## User Module

Responsibilities:

- User profile
- Preferences
- Contact information

---

## Identity Module

Responsibilities:

- Identity verification workflow
- KYC workflow
- Provider abstraction

Current implementation:

Prototype provider.

Future implementation:

Government-approved identity provider.

---

## Bank Module

Responsibilities:

- Connect bank
- Disconnect bank
- OAuth flow
- Token management
- Retrieve accounts
- Retrieve balances
- Retrieve transactions

Current implementation:

Prototype provider.

Future implementation:

Direct Open Banking integrations.

---

## Payment Module

Responsibilities:

- Payment initiation
- Payment status
- Beneficiary management
- Payment history

The payment module should not depend on a specific payment provider.

---

## Notification Module

Responsibilities:

- Email
- Push notifications
- SMS (future)
- In-app notifications

---

## Audit Module

Responsibilities:

- Record important user actions
- Security events
- Administrative actions

Audit logs should never be editable.

---

## Admin Module

Responsibilities:

- Customer management
- Payment monitoring
- Audit review
- System management

---

# Engineering Principles

Follow these principles throughout the project:

- Clean Architecture
- SOLID Principles
- Separation of Concerns
- High Cohesion
- Low Coupling
- Dependency Injection
- Provider Pattern
- Interface-first design
- Feature-based folder structure

Business logic must remain independent from third-party SDKs.

---

# Technology Stack

Backend

- Node.js
- Javascript
- Fastify

Database

- PostgreSQL

Cache

- Redis

Authentication

- JWT

Storage

local

---

# Coding Guidelines

When generating code:

- Keep modules independent.
- Never place business logic inside controllers.
- Prefer services and interfaces.
- Avoid hardcoded provider implementations.
- Keep APIs RESTful and consistent.
- Write reusable, production-quality code.
- Follow consistent naming conventions.
- Handle errors gracefully.
- Validate all request payloads.
- Design modules so prototype providers can later be replaced with production providers.

---

# Future Production Vision

The backend should be written so that the following integrations can later be added with minimal code changes:

- Omani Open Banking APIs
- Government Identity Provider
- Production KYC provider
- Production Payment Infrastructure
- Notification Providers

No architectural redesign should be required when replacing prototype providers with real production services.

---

# Primary Goal for AI Agent

Generate clean, scalable, production-quality backend architecture suitable for a modern fintech platform.

Focus on maintainability, modularity, and future extensibility rather than implementing temporary prototype logic directly into the business layer.
