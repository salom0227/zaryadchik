# ZaryadUz Backend API

Production-ready backend for EV charging station booking platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT + Refresh Tokens
- **Security**: Helmet, Rate Limiting, CORS
- **File Upload**: Multer
- **Real-time**: Socket.IO
- **Logging**: Winston

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── database/        # SQL schemas & migrations
├── uploads/         # Uploaded files
├── logs/            # Application logs
└── server.js        # Entry point
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run database migrations:
```bash
psql -U postgres -d zaryaduz -f database/schema.sql
```

4. Start development server:
```bash
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh-token` - Refresh access token

### Stations
- `GET /api/stations` - List all stations
- `GET /api/stations/:id` - Get station details
- `POST /api/stations` - Create station (admin)
- `PUT /api/stations/:id` - Update station (admin)
- `DELETE /api/stations/:id` - Delete station (admin)

### Bookings
- `GET /api/bookings/my` - User's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/block` - Block user
- `PUT /api/admin/users/:id/unblock` - Unblock user

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | zaryaduz |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| ADMIN_USERNAME | Admin login | admin |
| ADMIN_PASSWORD | Admin password | admin123 |

## Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (Helmet)
- ✅ CORS configuration
- ✅ Input validation

## License

ISC
