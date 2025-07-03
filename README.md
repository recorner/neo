# Neo Marketplace

A production-grade e-commerce marketplace built with modern web technologies.

## 🚀 Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: MinIO (S3-compatible object storage)
- **Authentication**: JWT with 2FA support
- **Containerization**: Docker & Docker Compose
- **Styling**: TailwindCSS
- **Package Manager**: pnpm

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HAProxy       │    │   SvelteKit     │    │   PostgreSQL    │
│   (Load Balancer│────│   Application   │────│   Database      │
│   & SSL Termination   │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │     MinIO       │
                       │ Object Storage  │
                       └─────────────────┘
```

## 🔥 Features

- **User Management**: Registration, login, 2FA authentication
- **Marketplace**: Product listings, categories, search
- **Cart & Orders**: Shopping cart, order management
- **Payments**: Integration with payment providers
- **Admin Panel**: User management, settings, analytics
- **Seller Dashboard**: Product management, order tracking
- **Security**: Argon2 password hashing, JWT tokens, role-based access

## 🛠️ Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- pnpm

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/recorner/neo.git
   cd neo
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

3. **Apply database migrations**
   ```bash
   docker exec neo_app_1 npx prisma migrate deploy
   ```

4. **Access the application**
   - Main application: http://localhost
   - MinIO console: http://localhost:45051

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgres://doadmin:AVNS_3b1YnGoB1Y5mAysdpOx@postgres:5432/defaultdb
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
JWT_SECRET=supersecretjwtkey123456789
NOWPAYMENTS_API_KEY=your-api-key
```

## 🌟 Production Deployment

### Docker Production Build

```bash
# Build production images
docker-compose build --no-cache

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
neo/
├── src/
│   ├── lib/                 # Shared utilities and components
│   ├── routes/             # SvelteKit routes
│   └── app.html            # HTML template
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── docker-compose.yml      # Development Docker setup
└── Dockerfile             # Application container
```

## 🔒 Security Features

- **Password Security**: Argon2 hashing algorithm
- **Authentication**: JWT tokens with configurable expiration
- **2FA Support**: Time-based one-time passwords (TOTP)
- **Role-based Access**: Admin, seller, and user roles

## 🤝 Contributing

1. **Development Workflow**
   ```bash
   # Create feature branch from dev
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   
   # Make changes and commit
   git add .
   git commit -m "feat: your feature description"
   
   # Push and create PR to dev branch
   git push origin feature/your-feature-name
   ```

2. **Branch Strategy**
   - `main`: Production-ready code
   - `dev`: Development branch for integration
   - `feature/*`: Feature development branches

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ using modern web technologies**
