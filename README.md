# SmartStock

**Inventory and Sales Management System** built with React, ASP.NET Core Web API, and PostgreSQL.

SmartStock is a full-stack web application designed to help small businesses manage products, monitor inventory, record sales, and understand business performance from one dashboard. It is an ongoing software engineering portfolio project.

## Features

- **Dashboard:** Today's revenue and sales, inventory value, stock alerts, revenue chart, top-selling products, inventory health, recent sales, and quick actions.
- **Product management:** Create and edit products, search by name or SKU, filter by stock status, inspect product details, archive products, and restore archived records.
- **Stock management:** Record stock-in and stock-out adjustments, view movement history, and validate quantities to prevent insufficient-stock operations.
- **Sales management:** Create sales, review transactions and sale details, and connect sales activity to inventory tracking.
- **Authentication and authorization:** JWT-based login with role-aware access for Admin, Staff, and Viewer accounts.
- **Responsive interface:** Desktop layouts and a mobile navigation drawer for smaller screens.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, JavaScript, Vite, Tailwind CSS, Lucide icons |
| Backend | C#, ASP.NET Core Web API |
| Database | PostgreSQL, Entity Framework Core |
| Authentication | JWT, role-based authorization |
| Testing | .NET automated tests, frontend helper tests, ESLint |

## Project Structure

```text
SmartStock/
├── SmartStock.API/                 # HTTP API and authentication
├── SmartStock.Application/         # DTOs and application contracts
├── SmartStock.Domain/              # Domain entities
├── SmartStock.Infrastructure/      # EF Core database access and migrations
├── SmartStock.Tests/               # Backend automated tests
└── smartstock.client/              # React frontend
    └── src/
        ├── components/
        ├── pages/
        └── utils/
```

## Getting Started (Local Development)

### Prerequisites

- .NET SDK compatible with the backend project
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Ikhmal0811/SmartStock.git
cd SmartStock
```

### 2. Configure the backend

Set up a local PostgreSQL database and supply a connection string and JWT configuration using **local environment variables or user secrets**. Do not commit real passwords or signing keys.

> **Database setup note:** The current EF Core migration history has a known fresh-database bootstrap limitation: the initial baseline migration does not create the complete schema. A clean installation may require additional setup until the migration chain is repaired. Avoid running repository SQL repair scripts against an existing database without reviewing them and taking a backup.

### 3. Start the API

From the repository root, run the ASP.NET Core API project using your local development configuration:

```bash
dotnet run --project SmartStock.API
```

Use the URL reported by the API process. The frontend Vite proxy currently targets a local HTTPS API address; ensure it matches your running API before testing requests.

### 4. Start the frontend

In a separate terminal:

```bash
cd smartstock.client
npm install
npm run dev
```

Open the local URL displayed by Vite.

### 5. Sign in

Use accounts provisioned in your own local database. No shared demo credentials are included in this README.

## Testing

Frontend commands (from `smartstock.client/`):

```bash
npm run lint
npm run build
npm run test:helpers
```

Backend tests (from the repository root):

```bash
dotnet test SmartStock.Tests
```

**Important:** Run integration tests only against a dedicated test database, never against a database containing valuable development or production data.

### Latest reported verification

| Check | Result |
| --- | --- |
| Frontend lint | 0 errors |
| Frontend build | Passed |
| Frontend helper tests | 17/17 passed |
| Backend build | Passed |
| Backend tests | 45/45 passed |
| Product management real API / PostgreSQL testing | Passed |

These results reflect the latest development verification reported in November 2026; they are not a live CI status.

## Current Development Status

SmartStock is **under active development**, not yet presented as production-ready.

- Product Management has passed end-to-end testing against an isolated PostgreSQL database.
- Stock Management and sales/inventory consistency are scheduled for further real API verification.
- Deployment configuration and clean-database migration setup still need finalization.
- Final regression testing, documentation, and release preparation remain planned.

## Security Notes

- Keep database credentials, JWT signing secrets, private keys, and `.env` files out of Git.
- Test-only JWT keys must never be reused in production.
- Role-based access is enforced by the backend; hiding a frontend control alone is not authorization.
- Review configuration and dependencies before deploying publicly.

## Roadmap

- [x] Product management and archived product workflows
- [x] Dashboard and analytics UI
- [x] Responsive navigation and page layouts
- [x] Product Management real API verification
- [ ] Complete Stock Management end-to-end verification
- [ ] Verify sales transactions and inventory consistency end to end
- [ ] Final regression testing
- [ ] Resolve fresh-database migration bootstrap and deployment configuration
- [ ] Final documentation and release

## Author

Developed as a software engineering portfolio project.

**Repository:** [Ikhmal0811/SmartStock](https://github.com/Ikhmal0811/SmartStock)
