# CareConnect

## Project Overview
CareConnect is an AI-assisted home-services marketplace. Customers describe a job, receive ranked provider matches and quotes, book a verified provider, track execution, review evidence, pay invoices, and open disputes from one workflow.

## Problem Statement
Home-service customers often struggle to find qualified professionals, compare prices, coordinate schedules, verify completed work, and resolve service issues. Providers need a focused pipeline for matching opportunities, quoting, scheduling, evidence, invoices, and reviews.

## Objectives
- Match service requests to capable providers using deterministic AI-assisted classification and ranking.
- Make quoting, scheduling, job execution, payment, and dispute handling transparent.
- Enforce role authorization and resource ownership at every protected API boundary.
- Provide operations, support, and admin teams with analytics and auditability.

## Features
- Customer request creation with AI category, skills, urgency, and price range.
- AI smart diagnosis with follow-up questions, confidence scoring, and a safety disclaimer.
- AI image-analysis support with mock fallback for issue detection and recommended action.
- AI price estimation stored with the service request and shown to customers before provider selection.
- Emergency service mode with explicit confirmation, Ops alerts, and priority handling.
- Home profile and maintenance history tracking for customer appliances and service records.
- Predictive maintenance recommendation support surfaced through the notification workflow.
- Provider matching with compatibility scores and reasoning.
- Provider profiles, verification, skills, service areas, availability, quotes, jobs, evidence, invoices, and reviews.
- Quote comparison and booking lifecycle management.
- Availability conflict detection and double-booking protection.
- Itemized invoices and simulated payments/refunds.
- Disputes, support resolution, notifications, and immutable audit logs.
- Search, filters, pagination, role-specific analytics, and responsive dashboards.

## New Features
- AI diagnosis endpoint: `POST /api/v1/ai/diagnosis`
- AI image analysis endpoint: `POST /api/v1/ai/image-analysis`
- AI price estimate endpoint: `POST /api/v1/ai/price-estimate`
- Customer home profile: `GET|POST /api/v1/customers/me/home`
- Maintenance history: `GET /api/v1/customers/me/maintenance` and `POST /api/v1/customers/maintenance`
- Maintenance recommendations: `GET /api/v1/customers/maintenance/recommendations`
- Emergency request confirmation: `POST /api/v1/requests/:id/emergency`
- Reassignment support: `POST /api/v1/reassign/bookings/:id/reassign`

The app continues to use the existing AI abstraction and mock fallback strategy so it remains operational even when no external AI key is present.

## User Roles
- `CUSTOMER`: requests, quote comparison, bookings, payments, disputes, and reviews.
- `SERVICE_PROVIDER`: profile, verification status, matching requests, quotes, availability, jobs, evidence, invoices, and reviews.
- `OPERATIONS_MANAGER`: dispatch, provider assignment, escalations, and operational oversight.
- `SUPPORT_AGENT`: dispute investigation, notes, escalation, resolution, and refunds.
- `PLATFORM_ADMIN`: users, providers, verification, categories, skills, pricing, analytics, and audit logs.

## Technology Stack
- Frontend: React 18, Vite, React Router, Zustand, Tailwind CSS, Lucide React, Recharts, Axios.
- Backend: Node.js, Express, Mongoose, MongoDB, JWT, bcryptjs, Multer, Cloudinary.
- Testing: Node's built-in test runner, service-level lifecycle tests, live API acceptance checks, and browser smoke checks.

## System Architecture
The frontend is a Vite React SPA. It communicates with the Express REST API under `/api/v1`. The backend uses controllers, services, Mongoose models, middleware, and role-aware ownership checks. MongoDB stores marketplace state; Cloudinary is optional for evidence files, with authenticated local storage fallback for development.

## Database Architecture
Main collections/models:
`User`, `ProviderProfile`, `ServiceCategory`, `Skill`, `ServiceRequest`, `Quote`, `Availability`, `Booking`, `JobEvidence`, `Invoice`, `Dispute`, `Notification`, `Review`, and `AuditLog`.

Relationships use MongoDB ObjectId references. Bookings connect requests, quotes, customers, and providers. Evidence, invoices, disputes, and reviews attach to bookings. Provider profiles attach to users and categories.

## AI Architecture
`AIService` supports two modes:
1. If `AI_API_KEY` is configured, it attempts an external LLM classification call.
2. Without a key, a deterministic rule-based fallback classifies supported service language and returns category, skills, urgency, estimated cost, and reasoning.

The washing-machine demonstration is deterministic: it returns `Appliance Repair` and `Washing Machine Repair`.

## Provider Matching Algorithm
Verified and currently available providers are scored using:
- Skill alignment: 45%.
- Rating normalization: 35%.
- Experience: 20%.

The API returns match scores, rating data, and human-readable matching reasons. Availability and booking checks run again before booking creation.

## Booking Workflow
`Customer request -> AI classification -> provider matching -> provider quote -> customer accepts quote -> booking -> provider on the way -> in progress -> evidence -> completed -> invoice -> customer confirmation -> payment -> review`.

Bookings use a state machine and availability lock to reject invalid transitions and overlapping appointments.

## API Documentation
All API routes are prefixed with `/api/v1`.

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`.
- Services: `GET /services`; admin/operations category management is under `/admin/categories`.
- Requests: `POST /requests`, `GET /requests`, `GET /requests/:id`, `PATCH /requests/:id/cancel`.
- Providers: `GET /providers`, `GET /providers/:id`, `GET /providers/:id/reviews`, `GET /providers/me`, `PUT /providers/me`.
- Quotes: `POST /quotes`, `GET /quotes/request/:requestId`, `GET /quotes/mine`, `PUT /quotes/:id`, `POST /quotes/:id/accept`, `POST /quotes/:id/withdraw`.
- Bookings: `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status`, `POST /bookings/:id/cancel`, `POST /bookings/:id/evidence`.
- Availability: `GET|POST /availability`, `PATCH|DELETE /availability/:id`.
- Invoices: `GET /invoices`, `GET /invoices/:id`, `POST /invoices/:id/pay`.
- Disputes: `GET /disputes`, `GET /disputes/:id`, `POST /disputes`, assignment, notes, escalation, resolution, and rejection endpoints.
- Reviews: `POST /reviews`, `GET /reviews/mine`, `GET /reviews/provider/:providerId`, `GET /reviews/booking/:bookingId`.
- Notifications: `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`.
- Password security: `POST /auth/change-password` validates the current password and hashes the new password with bcryptjs.
- Analytics: protected `/analytics/admin`, `/analytics/provider`, and `/analytics/customer`.
- Admin: `/admin/users`, `/admin/providers`, `/admin/categories`, `/admin/skills`, `/admin/bookings`, `/admin/disputes`, `/admin/analytics`, `/admin/audit-logs`.
- Operations: `/operations/dashboard`, `/operations/bookings`, `/operations/jobs`, `/operations/providers`, `/operations/bookings/:id/assign`.

## Folder Structure
```text
backend/
  config/ controllers/ middleware/ models/ routes/ services/ seed/ tests/ utils/
  server.js
frontend/
  src/components/ src/pages/ src/services/ src/store/ App.jsx
  vite.config.js
README.md
.env.example
```

## Environment Variables
Copy `backend/.env.example` to `backend/.env` and set values for your environment.

- `PORT`: backend port, normally `5000`.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: required signing secret; use a long random value.
- `JWT_EXPIRES_IN`: JWT lifetime, default `7d`.
- `AI_API_KEY`: optional external AI key; blank uses the deterministic fallback.
- `AI_DIAGNOSIS_ENABLED`, `AI_IMAGE_ANALYSIS_ENABLED`, `AI_PRICE_ESTIMATION_ENABLED`: feature flags for AI modules; defaults to enabled in the local mock mode.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: optional Cloudinary evidence storage credentials.
- `USE_MEMORY_DB`: set `true` for isolated local/demo runs; omit for a persistent MongoDB instance.
- `CLIENT_ORIGINS`: comma-separated allowed frontend origins, for example `http://localhost:3000,http://127.0.0.1:3000`.
- `INVOICE_TAX_RATE`: optional invoice tax rate, default `0.05`.
- Authentication endpoints use an in-memory rate limiter; production deployments should use a shared rate-limit store.

Never commit real secrets. The repository `.env.example` contains placeholders only.

## Installation
From the repository root:

```powershell
npm run install:all
```

Or install independently:

```powershell
Push-Location backend; npm install; Pop-Location
Push-Location frontend; npm install; Pop-Location
```

## Running Frontend
```powershell
Push-Location frontend; npm run dev; Pop-Location
```

The Vite app runs at `http://localhost:3000`. Set `VITE_API_BASE` when the backend is not behind the Vite proxy, for example `http://localhost:5001/api/v1`.

## Running Backend
```powershell
Push-Location backend; npm start; Pop-Location
```

The API runs on `http://localhost:5000` by default.

## Database Setup
Install MongoDB locally and start it with:

```powershell
mongod --dbpath C:\data\db
```

Then set `MONGO_URI=mongodb://127.0.0.1:27017/careconnect` and `USE_MEMORY_DB=false` in `backend/.env`. For a portable demo without MongoDB, use `USE_MEMORY_DB=true`.

## Seed Data
With the backend environment configured:

```powershell
Push-Location backend; npm run seed; Pop-Location
```

The seed resets the selected database and creates categories, providers, sample requests, quotes, bookings, disputes, notifications, and all demo roles.

## Testing
Backend unit and service tests:

```powershell
Push-Location backend; npm test; Pop-Location
```

Frontend production build:

```powershell
Push-Location frontend; npm run build; Pop-Location
```

Frontend lint, when ESLint dependencies are installed:

```powershell
Push-Location frontend; npm run lint; Pop-Location
```

The final acceptance pass also verifies the complete customer/provider/support/admin workflow against an isolated in-memory database.

## Security
- JWT authentication with required `JWT_SECRET` and active-user validation.
- Role authorization for all privileged route groups.
- Customer/provider/admin ownership checks for private resources.
- bcrypt password hashing.
- Explicit CORS allowlist and request-body limits.
- Upload extension, MIME, signature, file-count, part, and size validation.
- Authenticated ownership checks for local evidence files.
- Security headers and sanitized API error responses without stack traces.
- Immutable audit log writes for important mutations.

## Future Enhancements
- Replace simulated payments with a production payment provider.
- Add formal request-schema validation middleware and API contract generation.
- Add refresh-token rotation and password recovery flows.
- Add automated browser E2E tests to CI.
- Add code splitting for the chart-heavy frontend bundle.
- Add production observability, rate limiting, and background job processing.
