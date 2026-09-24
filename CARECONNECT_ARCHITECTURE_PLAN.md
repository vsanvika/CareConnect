# CareConnect – AI-Enabled Home Services Booking & Operations Platform
## Technical Architecture & Implementation Roadmap

---

### Executive Overview & Initial Status Check
- **Directory Status**: `e:\CareConnect` has been inspected and confirmed to be **completely empty**.
- **Project Type**: Full-stack MERN (MongoDB, Express.js, React, Node.js) with Vite, Tailwind CSS, Zustand, and AI Service integration.
- **Roles Handled**: `CUSTOMER`, `SERVICE_PROVIDER`, `OPERATIONS_MANAGER`, `SUPPORT_AGENT`, `PLATFORM_ADMIN`.
- **Supported Domains**: Plumbing, Electrical, Cleaning, Appliance Repair, AC/HVAC, Carpentry, Painting, Home Maintenance, Pest Control.

---

## 1. Overall Architecture

CareConnect uses a decoupled client-server architecture with an intelligent AI Service Abstraction layer.

```
 +-----------------------------------------------------------------------------------+
 |                                   CLIENT LAYER                                    |
 |     React 18 + Vite + Tailwind CSS + React Router + Zustand + React Hook Form      |
 |  +---------------+  +------------------+  +-------------------+  +-------------+  |
 |  | Customer View |  | Provider Portal  |  | Support & Ops Hub |  | Admin Panel |  |
 |  +---------------+  +------------------+  +-------------------+  +-------------+  |
 +------------------------------------------+----------------------------------------+
                                            | REST API (JSON / Multipart) + JWT Auth
                                            v
 +-----------------------------------------------------------------------------------+
 |                                   BACKEND LAYER                                   |
 |                             Node.js + Express.js API                              |
 |  +--------------------+  +--------------------+  +-----------------------------+  |
 |  | Auth & Access Ctrl |  | Service & Quotes   |  | Lifecycle & State Engines   |  |
 |  | (JWT + RBAC Middleware)| (Matching & Matching)| (Bookings, Disputes, Invoices)|  |
 |  +--------------------+  +--------------------+  +-----------------------------+  |
 +-----------------------+-------------------+---------------------------------------+
                         |                   |                   |
                         v                   v                   v
 +-----------------------+----+    +---------+----------+   +----+-------------------+
 |   AI SERVICE ENGINE        |    |   PERSISTENCE LAYER  |   | MEDIA STORAGE LAYER    |
 | (LLM Adapter + Fallback    |    |   MongoDB + Mongoose |   | Multer + Cloudinary /  |
 | Classification & Ranking)  |    |  (Indexed Schemas)   |   | Local Dev Fallback     |
 +----------------------------+    +----------------------+   +------------------------+
```

---

## 2. Frontend Architecture

- **Build Engine**: Vite + React 18 SPA (Single Page Application).
- **Styling & UI**: Tailwind CSS for responsive design, dynamic theme variables, glassmorphism, modern gradients, micro-animations, and Lucide React icons.
- **Form Management**: `react-hook-form` paired with client-side validation schema.
- **Charts & Data Visualizations**: `recharts` for admin and operations analytics.
- **Component Design System**:
  - `components/common`: Buttons, Modals, Cards, Badges, Loaders, Toasts, Status Chips.
  - `components/layout`: Navbar, Sidebar, Page Container, Dynamic Header, Footer.
  - `components/domain`: ServiceRequestCard, QuoteCard, ProviderRankList, DisputeChat, EvidenceViewer, InvoiceDownload.
  - `components/guards`: ProtectedRoute, RoleGuard, ResourceOwnerGuard.

---

## 3. Backend Architecture

- **Runtime & Framework**: Node.js REST API with Express.js.
- **Pattern**: Layered Controller-Service-Model architecture with Async Handlers.
- **Error Handling**: Centralized error middleware returning standardized error responses:
  `{ success: false, error: { code: 'HTTP_400', message: '...', details: [...] } }`.
- **Validation**: Middleware validation using Joi / express-validator schemas before request reaches controllers.
- **Async Handling**: Async error wrapper to catch unhandled promise rejections cleanly.

---

## 4. MongoDB / Mongoose Data Model

CareConnect utilizes 12 main collections:

1. **`User`**: `_name`, `email`, `password`, `phone`, `role` (`CUSTOMER`, `SERVICE_PROVIDER`, `OPERATIONS_MANAGER`, `SUPPORT_AGENT`, `PLATFORM_ADMIN`), `avatarUrl`, `isVerified`, `isActive`, `address` (`street`, `city`, `zipCode`, `coordinates: [lng, lat]`), `createdAt`.
2. **`ProviderProfile`**: `userId` (ref User), `businessName`, `skills` (array of category IDs), `experienceYears`, `hourlyRate`, `serviceAreaRadiusKm`, `location: { type: 'Point', coordinates: [lng, lat] }`, `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`), `ratingAverage`, `ratingCount`, `availabilitySchedule`, `isAvailableNow`.
3. **`ServiceCategory`**: `name`, `slug`, `description`, `icon`, `basePrice`, `requiredSkillTags`, `isActive`.
4. **`ServiceRequest`**: `customerId` (ref User), `categoryId` (ref ServiceCategory), `title`, `description`, `urgency` (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), `preferredSchedule`: `{ date, timeSlot }`, `location`, `images`: `[string]`, `aiAnalysis`: `{ classifiedCategory, identifiedSkills, urgencyScore, estimatedCostRange }`, `eligibleProviders`: `[{ providerId, matchScore, reasoning }]`, `status` (`DRAFT`, `AI_ANALYZED`, `QUOTING`, `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DISPUTED`).
5. **`Quote`**: `requestId` (ref ServiceRequest), `providerId` (ref User), `amount`, `breakdown`: `{ labor, materials, calloutFee }`, `estimatedDurationHours`, `availableDateSlot`, `notes`, `status` (`SUBMITTED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `WITHDRAWN`).
6. **`Booking`**: `requestId` (ref ServiceRequest), `quoteId` (ref Quote), `customerId` (ref User), `providerId` (ref User), `scheduledStart`, `scheduledEnd`, `totalAmount`, `status` (`CONFIRMED`, `PROVIDER_EN_ROUTE`, `IN_PROGRESS`, `JOB_COMPLETED`, `CUSTOMER_CONFIRMED`, `CANCELLED`, `DISPUTED`), `cancellationReason`.
7. **`JobEvidence`**: `bookingId` (ref Booking), `uploadedBy` (ref User), `evidenceType` (`BEFORE_PHOTO`, `AFTER_PHOTO`, `WORK_LOG`, `PARTS_RECEIPT`), `fileUrls`: `[string]`, `notes`, `timestamp`.
8. **`Invoice`**: `bookingId` (ref Booking), `invoiceNumber`, `customerId` (ref User), `providerId` (ref User), `lineItems`: `[{ description, amount }]`, `subtotal`, `platformFee`, `tax`, `totalAmount`, `paymentStatus` (`PENDING`, `PAID`, `REFUNDED`, `PARTIALLY_REFUNDED`), `issuedAt`, `paidAt`.
9. **`Dispute`**: `bookingId` (ref Booking), `openedBy` (ref User), `assignedAgentId` (ref User), `reason`, `description`, `evidenceUrls`: `[string]`, `status` (`OPENED`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), `resolutionDetails`: `{ action: 'REFUND_FULL' | 'REFUND_PARTIAL' | 'RE_SERVICE' | 'DISMISS', amount: number, notes: string }`, `history`: `[{ senderId, message, timestamp }]`.
10. **`Notification`**: `recipientId` (ref User), `title`, `message`, `type` (`QUOTE_RECEIVED`, `BOOKING_CONFIRMED`, `JOB_UPDATE`, `DISPUTE_UPDATE`, `INVOICE_READY`), `read`: `boolean`, `linkUrl`.
11. **`Review`**: `bookingId` (ref Booking), `customerId` (ref User), `providerId` (ref User), `rating` (1-5), `comment`, `createdAt`.
12. **`AuditLog`**: `actorId` (ref User), `action`, `targetCollection`, `targetId`, `ipAddress`, `details`, `timestamp`.

---

## 5. Relationships Between Collections

```
   +----------+        1:1       +-----------------+
   |   User   |<-----------------| ProviderProfile |
   +----------+                  +-----------------+
        |                                 |
        | 1:N                             | 1:N
        v                                 v
+----------------+  1:N quotes   +-----------------+
| ServiceRequest |-------------->|      Quote      |
+----------------+               +-----------------+
        |                                 | (1 accepted quote creates)
        | 1:1                             v
        +--------------------------->+-----------------+
                                     |     Booking     |
                                     +-----------------+
                                       /    |      \
                                 1:N  /     | 1:1   \ 1:1
                                     v      v        v
                        +-------------+ +---------+ +---------+
                        | JobEvidence | | Invoice | | Dispute |
                        +-------------+ +---------+ +---------+
                                                |       |
                                                v       v
                                           +-----------------+
                                           |     Review      |
                                           +-----------------+
```

---

## 6. Authentication Architecture

- **JWT Tokens**: Signed with `JWT_SECRET`, containing `{ userId, role }`. Token expiration: 24h for Access Token, 7d for Refresh Token stored securely.
- **Password Hashing**: `bcryptjs` with salt rounds = 10.
- **Middleware**: `protect` middleware validates `Bearer <token>` header, decodes payload, attaches `req.user` to request context.
- **Password Reset & Verification**: Token-based email payload structure for credential recovery simulation.

---

## 7. Role-Based Authorization (RBAC)

A dedicated `authorize(...allowedRoles)` middleware checks `req.user.role`:

| Feature / Resource | CUSTOMER | SERVICE_PROVIDER | OPERATIONS_MANAGER | SUPPORT_AGENT | PLATFORM_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Create Request | ✅ | ❌ | ❌ | ❌ | ✅ |
| Submit Quote | ❌ | ✅ | ❌ | ❌ | ✅ |
| Accept Quote / Book | ✅ | ❌ | ❌ | ❌ | ✅ |
| Job Execution & Evidence Upload | ❌ | ✅ | ❌ | ❌ | ✅ |
| Dispute Creation | ✅ | ✅ | ❌ | ❌ | ✅ |
| Resolve Dispute & Refund | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Services & Verification | ❌ | ❌ | ✅ | ❌ | ✅ |
| View System Analytics & Logs | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Users & Roles | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. Resource Ownership Rules

- `isResourceOwner(model, idParam, userForeignKey)`: Middleware ensuring:
  - Customers can only view/modify their own requests, bookings, disputes, and invoices.
  - Service Providers can only edit their own quotes, profiles, and job evidence.
  - Support Agents can access disputes assigned to them or unassigned queues.
  - Operations Managers and Platform Admins bypass ownership checks for system oversight.

---

## 9. REST API Structure

- `/api/v1/auth`: `POST /register`, `POST /login`, `GET /me`, `PUT /profile`, `POST /change-password`
- `/api/v1/services`: `GET /`, `POST /`, `GET /:id`, `PUT /:id`
- `/api/v1/requests`:
  - `POST /` (Create + AI Classify)
  - `GET /` (Filtered by role)
  - `GET /:id`
  - `GET /:id/matches` (AI provider recommendations)
  - `PATCH /:id/cancel`
- `/api/v1/quotes`:
  - `POST /` (Provider submits quote)
  - `GET /request/:requestId`
  - `POST /:id/accept` (Customer accepts quote -> creates booking)
  - `POST /:id/reject`
- `/api/v1/bookings`:
  - `GET /`
  - `GET /:id`
  - `PATCH /:id/status` (Update job state)
  - `POST /:id/evidence` (Upload job proof)
  - `POST /:id/complete`
- `/api/v1/invoices`: `GET /:id`, `POST /:id/pay`, `GET /my-invoices`
- `/api/v1/disputes`: `POST /`, `GET /`, `GET /:id`, `PATCH /:id/assign`, `POST /:id/resolve`
- `/api/v1/reviews`: `POST /`, `GET /provider/:providerId`
- `/api/v1/analytics`: `GET /overview`, `GET /provider-metrics`, `GET /dispute-stats`
- `/api/v1/ai`: `POST /classify-request`, `POST /rank-providers`

---

## 10. AI Architecture & Dual Mode Implementation

- **Interface**: `AIService` class with two modes:
  1. `LLMProvider` (Using OpenAI / Gemini / Claude API via fetch when `AI_API_KEY` is present).
  2. `MockAIProvider` (Deterministic rule-based keyword matcher & NLP heuristics fallback when key is absent).
- **Functionality**:
  - `classifyRequest(title, description)` -> Returns Category, Required Skill Tags, Urgency Rating, Estimated Price Range.
  - `rankProviders(request, eligibleProviders)` -> Computes contextual compatibility index and generates rationale text for each provider recommendation.

---

## 11. Provider Matching & Ranking Algorithm

Providers are evaluated using a composite weighted scoring algorithm:

$$\text{Score} = (W_s \times S) + (W_g \times G) + (W_r \times R) + (W_c \times C) + (W_a \times A)$$

Where:
- $S$ = Skill Tag Overlap Ratio (0 - 1.0) - Weight: **0.35**
- $G$ = Geographic Proximity Score ($1 - \frac{\text{Distance}}{\text{MaxRadius}}$) - Weight: **0.25**
- $R$ = Normalized Provider Rating ($\frac{\text{Rating}}{5.0}$) - Weight: **0.20**
- $C$ = Historical Job Completion Rate - Weight: **0.10**
- $A$ = Current Capacity / Load Balance Score - Weight: **0.10**

AI dynamically ranks top providers and formats plain-language explanations (e.g. *"Matched because Provider has 98% AC repair rating and is located 2.4 km away"*).

---

## 12. Availability & Conflict Detection Algorithm

- **Slot Collision Detection**: Checks provider's existing active `Booking` records where:
  `existingStart < requestedEnd AND existingEnd > requestedStart`.
- **Buffer Interval**: Enforces a mandatory 45-minute buffer between back-to-back provider bookings.
- **Locks**: Prevents double-booking during quote acceptance by utilizing a database transaction or atomic query condition on booking creation.

---

## 13. Booking Lifecycle State Machine

```
 [ Customer Accepts Quote ]
            |
            v
       CONFIRMED ---- (Cancel by customer/provider) ----> CANCELLED
            |
            v
    PROVIDER_EN_ROUTE
            |
            v
       IN_PROGRESS
            |
  (Upload Evidence & Complete)
            v
     JOB_COMPLETED
            |
(Auto-Generate Invoice & Customer Confirm)
            |
            +------------------------+
            |                        |
            v                        v
    CUSTOMER_CONFIRMED           DISPUTED
            |                        |
     (Leave Review)          (Support Agent Resolves)
            |                        |
            +-----------+------------+
                        |
                        v
                 CLOSED / RESOLVED
```

---

## 14. Quote Lifecycle

1. `SUBMITTED`: Provider sends pricing breakdown & proposed slot.
2. `ACCEPTED`: Customer accepts quote. Trigger:
   - Request status becomes `BOOKED`.
   - Selected quote status becomes `ACCEPTED`.
   - All other quotes for this `requestId` transition to `REJECTED` / `EXPIRED`.
   - Booking record automatically instantiated.
3. `WITHDRAWN`: Provider cancels quote prior to acceptance.

---

## 15. Dispute & Complaint Lifecycle

1. **Trigger**: Customer or Provider flags job during `IN_PROGRESS`, `JOB_COMPLETED`, or post-billing.
2. **State**: Status `OPENED`.
3. **Queue**: Operations Manager / Support Agent views unassigned disputes dashboard and claims ticket (`UNDER_REVIEW`).
4. **Resolution Engine**:
   - `FULL_REFUND`: Adjusts invoice balance, triggers refund audit log.
   - `PARTIAL_REFUND`: Splits payment, updates invoice.
   - `RE_SERVICE`: Re-opens request for re-assignment without extra charge.
   - `DISMISS`: Reaffirms provider payout.
5. **State**: Status moves to `RESOLVED`, notifying both parties.

---

## 16. Notification Architecture

- **In-App Event Bus**: Triggered on status transitions (Quote received, Booking confirmed, Evidence uploaded, Dispute update).
- **Schema**: `Notification` collection linked to user.
- **Frontend Real-time Polling / Toast Sync**: Zustand `notificationStore` polls every 15s or updates upon API response, triggering interactive toast alerts.

---

## 17. File Upload Architecture

- **Upload Pipeline**: Express + `multer` middleware.
- **Production Mode**: Direct stream to `Cloudinary` using `CLOUDINARY_URL` / API keys.
- **Local Fallback**: Saves uploaded assets into `/uploads/` directory with static middleware serving (`http://localhost:5000/uploads/...`) when Cloudinary environment variables are unconfigured.

---

## 18. Invoice Architecture

- **Automatic Trigger**: Instantiated immediately when provider marks job as `JOB_COMPLETED`.
- **Computation**:
  - `subtotal` = Labor + Materials + Service Call Charge
  - `platformFee` = 10% of subtotal
  - `tax` = 5% of subtotal
  - `totalAmount` = subtotal + tax
- **Format**: Structured JSON invoice object ready for client rendering, print formatting, and PDF export.

---

## 19. Analytics Architecture

- **Dashboard Aggregations**:
  - Total Platform Revenue & Platform Fee Commissions.
  - Active Bookings count by status breakdown.
  - Average Service Resolution Time per Category.
  - Provider Performance Scorecards (Completion Rate, On-time Rate, Rating).
  - Dispute Rate & Resolution Time Metrics.

---

## 20. Frontend Routing Map

- `/`: Landing Page / Service Catalog Showcase
- `/login`, `/register`: Authentication Pages
- `/customer/dashboard`: Active Requests, Quotes Comparison, Current Bookings
- `/customer/request/new`: AI-assisted Request Creation Wizard
- `/customer/request/:id`: Request Details, Quote Selection, Provider Ranking
- `/customer/bookings/:id`: Live Job Progress, Evidence Inspection, Invoice & Review
- `/provider/dashboard`: Opportunity Feed, Eligible Requests, Quotes Submitted
- `/provider/jobs`: Provider Job Management, Status Controls, Evidence Uploader
- `/support/dashboard`: Dispute Queue, Ticket Details, Evidence Review, Resolution Form
- `/ops/dashboard`: System Health, Service Category Management, Provider Verification
- `/admin/analytics`: Financial Metrics, Revenue Breakdown, Audit Logs & User Management

---

## 21. Frontend State Management

Zustand stores:
1. `useAuthStore`: Token, current user profile, role helper, login/logout methods.
2. `useBookingStore`: Active bookings, current request state, quotes list, active job evidence.
3. `useNotificationStore`: Unread count, list of notifications, mark-as-read handler.
4. `useUIStore`: Dark mode toggle, modal triggers, toast stack control.

Axios Interceptor: Auto-attaches `Authorization: Bearer <token>`, globally catches `401 Unauthorized` to redirect to login.

---

## 22. Complete Folder Structure

```
e:\CareConnect/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── serviceController.js
│   │   ├── requestController.js
│   │   ├── quoteController.js
│   │   ├── bookingController.js
│   │   ├── evidenceController.js
│   │   ├── invoiceController.js
│   │   ├── disputeController.js
│   │   ├── reviewController.js
│   │   ├── analyticsController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── ownerMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── validateMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ProviderProfile.js
│   │   ├── ServiceCategory.js
│   │   ├── ServiceRequest.js
│   │   ├── Quote.js
│   │   ├── Booking.js
│   │   ├── JobEvidence.js
│   │   ├── Invoice.js
│   │   ├── Dispute.js
│   │   ├── Notification.js
│   │   ├── Review.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── quoteRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── disputeRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── aiRoutes.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── matchingService.js
│   │   ├── bookingService.js
│   │   ├── invoiceService.js
│   │   └── notificationService.js
│   ├── seed/
│   │   └── seedData.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── logger.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.jsx
    │   │   │   ├── Card.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   ├── Badge.jsx
    │   │   │   └── Toast.jsx
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   └── Footer.jsx
    │   │   └── domain/
    │   │       ├── ServiceCard.jsx
    │   │       ├── QuoteComparisonTable.jsx
    │   │       ├── ProviderRankCard.jsx
    │   │       ├── JobEvidenceUploader.jsx
    │   │       ├── DisputeTimeline.jsx
    │   │       └── InvoiceView.jsx
    │   ├── context/
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useFetch.js
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── customer/
    │   │   │   ├── CustomerDashboard.jsx
    │   │   │   ├── NewRequestPage.jsx
    │   │   │   └── RequestDetailPage.jsx
    │   │   ├── provider/
    │   │   │   ├── ProviderDashboard.jsx
    │   │   │   └── JobManagementPage.jsx
    │   │   ├── ops/
    │   │   │   ├── OpsDashboard.jsx
    │   │   │   └── ProviderVerificationPage.jsx
    │   │   ├── support/
    │   │   │   └── SupportDisputesPage.jsx
    │   │   └── admin/
    │   │       └── AdminAnalyticsPage.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── bookingService.js
    │   │   └── aiService.js
    │   ├── store/
    │   │   ├── useAuthStore.js
    │   │   ├── useBookingStore.js
    │   │   └── useNotificationStore.js
    │   ├── utils/
    │   │   ├── formatters.js
    │   │   └── constants.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    └── package.json
```

---

## 23. Testing Strategy

1. **Unit Testing**:
   - Test AI classification algorithm fallback outputs.
   - Test provider scoring function with varying inputs (skill match, distance, rating).
   - Test availability slot collision detector.
2. **Integration Testing**:
   - API endpoints validation with Supertest/Jest.
   - Authentication flow (Register -> Login -> Bearer Token Verification).
   - Request -> Quote -> Accept -> Booking creation sequence.
3. **End-to-End Workflow Validation**:
   - Customer request creation -> Provider quote submission -> Customer accepts quote -> Provider uploads job evidence -> Job completed -> Invoice generated -> Customer confirms -> Review posted.
   - Customer dispute creation -> Support Agent claims & resolves with partial refund -> Invoice adjustment verified.

---

## 24. Security Strategy

- **Input Sanitization**: Mongo-sanitize to defend against NoSQL query injections.
- **HTTP Hardening**: Helmet middleware to set safe security headers.
- **Rate Limiting**: `express-rate-limit` on `/api/v1/auth` endpoints (100 requests per 15 min window).
- **CORS Configuration**: Strict origin filtering matching the frontend host URL.
- **Data Protection**: Sensitive parameters (passwords, payment details) omitted in API outputs and logs.

---

## 25. Seed Data Strategy

A master seed script (`backend/seed/seedData.js`) will populate the system with:
- **Users**: role-based accounts are created only when a real user registers or is added by an admin.
- **Service Categories**: All 9 categories (Plumbing, Electrical, Cleaning, Appliance Repair, AC/HVAC, Carpentry, Painting, Home Maintenance, Pest Control) with default skill tags and base pricing.
- **Provider Profiles**: 4 distinct verified providers with distinct locations, ratings, and skill tags.
- **Requests & Quotes**: Sample requests across different states (`QUOTING`, `BOOKED`, `COMPLETED`, `DISPUTED`) with quotes, job evidence, invoices, and dispute history.

---

### Ready for Next Phase
The comprehensive architecture blueprint and technical plan are finalized and documented in `CARECONNECT_ARCHITECTURE_PLAN.md`. We are ready for your signal to begin the implementation phase.
