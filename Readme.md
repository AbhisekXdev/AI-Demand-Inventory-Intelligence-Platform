# AI Demand & Inventory Intelligence Platform

An AI-powered inventory management and demand forecasting platform designed to help businesses manage products, suppliers, warehouses, inventory, sales, and future demand through intelligent analytics and recommendations.

## 🚀 Project Overview

The AI Demand & Inventory Intelligence Platform combines a modern web application with backend APIs, database management, inventory analytics, and AI-assisted demand forecasting.

The platform is being developed with a **Node.js backend** and a **React.js frontend**, with MySQL as the primary relational database.

## 🎯 Objectives

- Manage products and SKUs
- Organize products into categories
- Manage suppliers and warehouses
- Track inventory levels and stock movements
- Manage sales and orders
- Analyze historical sales and inventory data
- Forecast future product demand
- Generate reorder recommendations
- Detect low-stock and overstock conditions
- Provide actionable AI-assisted business insights

## 🏗️ Architecture

```text
React.js Frontend
       │
       ▼
REST API
       │
       ▼
Node.js + Express.js
       │
       ├── Authentication / RBAC
       ├── Product Management
       ├── Category Management
       ├── Supplier Management
       ├── Warehouse Management
       ├── Inventory Management
       ├── Sales & Orders
       ├── Analytics
       ├── Demand Forecasting
       ├── AI Recommendations
       └── Alerts & Notifications
       │
       ▼
MySQL Database
       │
       ▼
AI / Forecasting Service
```

## 🛠️ Technology Stack

### Backend
- Node.js
- Express.js
- RESTful APIs
- Sequelize ORM
- JWT Authentication
- bcryptjs
- Express Validator
- Helmet
- CORS
- Morgan

### Database
- MySQL
- Sequelize ORM
- SQL
- Database Relationships
- Indexing

### Frontend
- React.js
- JavaScript ES6+
- Axios
- Tailwind CSS
- React Router
- Chart.js

### AI & Analytics
- Demand forecasting
- Sales trend analysis
- Inventory analytics
- Reorder recommendations
- AI-assisted inventory insights

### Tools & Deployment
- Git
- GitHub
- Postman
- VS Code
- Railway
- AWS
- Vercel

## 📦 Backend Modules

| Module | Status |
|---|---|
| Authentication & RBAC | 🚧 In Progress |
| Product Management | ✅ Completed |
| Category Management | 🚧 In Progress |
| Supplier Management | ⏳ Planned |
| Warehouse Management | ⏳ Planned |
| Inventory Management | ⏳ Planned |
| Sales & Orders | ⏳ Planned |
| Inventory Analytics | ⏳ Planned |
| Demand Forecasting | ⏳ Planned |
| AI Intelligence | ⏳ Planned |
| Alerts & Notifications | ⏳ Planned |
| Admin & System | ⏳ Planned |

## 🔐 Authentication

The backend uses JWT-based authentication.

Planned capabilities:

- User registration
- User login
- Password hashing with bcrypt
- JWT token generation
- Protected routes
- Role-based access control
- Admin / Manager / Staff roles
- Account activation/deactivation

## 📦 Product API

Current Product Management endpoints:

```text
POST   /api/products
GET    /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

Product functionality includes:

- Product creation
- SKU management
- Pricing
- Cost price
- Reorder level
- Product descriptions
- Active/inactive products
- Duplicate SKU prevention
- Soft deletion

## 🗄️ Database

Current core entities:

```text
User
Category
Product
Supplier
Warehouse
Inventory
Sale
```

Planned relationships:

```text
Category
   │
   └── Products

Supplier
   │
   └── Products

Warehouse
   │
   └── Inventory

Product
   │
   ├── Inventory
   └── Sales
```

## 📁 Backend Structure

```text
backend/
│
├── config/
│   └── database.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── inventory.controller.js
│   ├── supplier.controller.js
│   └── sales.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
│
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   ├── Supplier.js
│   ├── Warehouse.js
│   ├── Inventory.js
│   └── Sale.js
│
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── inventory.routes.js
│   ├── supplier.routes.js
│   └── sales.routes.js
│
├── services/
├── utils/
├── .env
├── .gitignore
├── package.json
└── server.js
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AI-Demand-Inventory-Intelligence-Platform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create MySQL database

```sql
CREATE DATABASE ai_inventory;
```

### 4. Configure environment variables

Create a `.env` file:

```env
PORT=5000

DB_NAME=ai_inventory
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d

NODE_ENV=development
```

**Never commit `.env` to GitHub.**

### 5. Start the development server

```bash
npm run dev
```

Server:

```text
http://localhost:5000
```

## ❤️ Health Check

```text
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "status": "healthy"
}
```

## 🧪 API Testing

Postman is used for API testing.

Example product request:

```http
POST /api/products
Content-Type: application/json
```

```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "description": "Business laptop",
  "price": 65000,
  "costPrice": 52000,
  "reorderLevel": 10
}
```

## 🔮 Planned AI Features

The AI layer will analyze historical business data to provide:

### Demand Forecasting
Predict expected product demand for upcoming periods.

### Reorder Recommendations
Recommend when and how much stock should be reordered.

### Low Stock Detection
Identify products that are approaching their reorder threshold.

### Overstock Detection
Identify products with excess inventory and low sales velocity.

### Intelligent Insights
Generate useful insights from:

- Sales history
- Product performance
- Inventory levels
- Seasonal demand
- Stock movement
- Supplier information

## 📊 Example Business Flow

```text
Customer Orders
       ↓
Sales Data
       ↓
Inventory Updated
       ↓
Historical Data Stored
       ↓
Analytics Engine
       ↓
Demand Forecast
       ↓
Reorder Recommendation
       ↓
Inventory Manager
```

## 🔒 Security

Security practices include:

- Password hashing with bcrypt
- JWT authentication
- Role-based authorization
- Environment variables for secrets
- Helmet security middleware
- Input validation
- Protected API routes
- Error handling
- No secrets committed to Git

## 🚧 Development Status

This project is currently under active development.

### Completed
- Backend project setup
- MySQL + Sequelize connection
- User model
- Product model
- Product CRUD APIs

### Currently Developing
- Category Management
- Database relationships

### Upcoming
- Supplier Management
- Warehouse Management
- Inventory Management
- Sales & Orders
- Analytics
- Demand Forecasting
- AI Recommendations
- Alerts
- React Dashboard
- Deployment

## 👨‍💻 Developer

**Abhisek Koyal**

Node.js Developer | Backend Developer | Full Stack JavaScript Developer

### Skills
Node.js • Express.js • React.js • MySQL • MongoDB • Sequelize • REST APIs • JWT • JavaScript • Git • AWS

## 📄 License

This project is developed for learning, portfolio, and demonstration purposes.
