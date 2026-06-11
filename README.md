# CRMS - Credentials Request Management System

A web-based system for managing student credential requests (Transcript of Records, Certificate of Enrollment, etc.) at educational institutions.

## Features

### Student Portal
- Submit credential requests (TOR, Certificate of Enrollment, Good Moral, etc.)
- Track request status via tracking number
- Online payment via PayMongo
- View request history and details
- Profile management

### Admin Portal (Registrar / Cashier / System Admin)

**Registrar:**
- Dashboard with request statistics
- Manage incoming requests (process, update status)
- Release credentials
- Search records
- Request details with student info and payment summary

**Cashier:**
- Payment queue (pending, online, cash)
- Verify payments (manual and PayMongo auto-check)
- Toggle online payment availability
- Daily collection breakdown (online vs cash)
- Paid transactions history

**System Admin:**
- System dashboard with stats and monthly trends
- User management (CRUD admin/cashier accounts)
- Credential types management
- Reports & Analytics with charts
- Audit logs

## Tech Stack

- **Backend:** Laravel 11, MySQL
- **Frontend:** React, Vite, Tailwind CSS, ApexCharts
- **Payments:** PayMongo API (online payments)
- **Auth:** Session-based (web guard for admins, student guard for students)

## Requirements

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL
- PayMongo API keys (for online payments)

## Installation

```bash
# Clone the repository
git clone <repo-url> crms
cd crms

# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Configure your .env file (database, PayMongo keys, etc.)

# Run migrations
php artisan migrate

# Seed default data
php artisan db:seed

# Build frontend assets
npm run build

# Start the development server
php artisan serve

# In a separate terminal, start queue worker (for notifications, etc.)
php artisan queue:work
```

## Environment Variables

Key `.env` configurations:

```
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx
```

## Admin Roles

| Role | Permissions |
|------|-------------|
| **Admin (Registrar)** | Manage credential requests, update statuses, release credentials |
| **Cashier** | Verify payments, manage payment queue, view daily collections |
| **System Admin** | User management, credential types, reports, audit logs |

## Development

```bash
# Watch frontend assets
npm run dev

# Build for production
npm run build
```

## License

MIT
