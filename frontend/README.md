# ISP Admin Panel - Frontend

A modern React + TypeScript frontend for the ISP Admin Panel, designed to work with the Django backend.

## 🚀 Features

- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **React Router** for client-side routing
- **React Query** for server state management
- **React Hook Form** with Yup validation
- **Atomix Design System** for consistent UI components
- **Dark Mode** by default with ISP branding
- **Responsive Design** for all screen sizes
- **JWT Authentication** with automatic token refresh
- **Role-Based Access Control** (Admin, Support, Accountant)

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ProtectedRoute.tsx
│   │   └── layout/
│   │       ├── Layout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useApi.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Customers.tsx
│   │   ├── Plans.tsx
│   │   ├── Subscriptions.tsx
│   │   ├── Billing.tsx
│   │   ├── Network.tsx
│   │   ├── Monitoring.tsx
│   │   └── Users.tsx
│   ├── services/
│   │   ├── apiService.ts
│   │   └── authService.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile
└── nginx.conf
```

## 🛠️ Tech Stack

- **React 18.2.0** - UI library
- **TypeScript 4.9.3** - Type safety
- **Vite 4.2.0** - Build tool and dev server
- **React Router DOM 6.8.1** - Client-side routing
- **React Query 4.29.5** - Server state management
- **React Hook Form 7.43.5** - Form management
- **Yup 1.0.2** - Schema validation
- **Axios 1.3.4** - HTTP client
- **Date-fns 2.29.3** - Date utilities
- **React Hot Toast 2.4.0** - Notifications
- **JWT Decode 3.1.2** - JWT token handling

## 🎨 Design System

This frontend is designed to use the **Atomix Design System** for consistent UI components. The design system provides:

- **40+ Components** - Comprehensive UI component library
- **Design Tokens** - Consistent colors, spacing, typography
- **Accessibility First** - WCAG 2.1 AA compliant
- **Dark Mode** - Built-in theme switching
- **Responsive** - Mobile-first design approach

### Color Palette

- **Primary**: `#7AFFD7` (Cyan)
- **Secondary**: `#1AFFD2` (Light Cyan)
- **Success**: `#4DFF9F` (Green)
- **Error**: `#DD6061` (Red)
- **Background**: `#000000` (Black)
- **Surface**: `#212121` (Dark Gray)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (Django)

### Development Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Production Build

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ISP Admin Panel
```

### Vite Configuration

The `vite.config.ts` includes:

- **Path aliases** for clean imports (`@/` points to `src/`)
- **API proxy** for development (forwards `/api` to backend)
- **React plugin** for JSX support

### TypeScript Configuration

The `tsconfig.json` includes:

- **Strict mode** enabled
- **Path mapping** for clean imports
- **Modern ES2020** target
- **React JSX** support

## 📱 Pages & Features

### Authentication
- **Login Page** - JWT authentication with role-based access
- **Protected Routes** - Automatic redirect for unauthenticated users
- **Token Refresh** - Automatic JWT token refresh

### Dashboard
- **Overview Stats** - Key metrics and KPIs
- **Recent Activity** - Latest system events
- **Quick Actions** - Common tasks shortcuts

### Customer Management
- **Customer List** - View and search customers
- **Customer Details** - Full customer information
- **Add/Edit Customer** - Create and update customer records

### Plan Management
- **Plan List** - View and manage internet plans
- **Plan Details** - Speed, pricing, and features
- **Plan Comparison** - Compare different plans

### Subscription Management
- **Subscription List** - Active and inactive subscriptions
- **Subscription Details** - Usage, billing, and status
- **Status Management** - Activate, suspend, cancel

### Billing & Payments
- **Invoice List** - View and manage invoices
- **Payment Tracking** - Payment history and status
- **Payment Methods** - Multiple payment provider support

### Network Management
- **Router Management** - MikroTik router configuration
- **Connection Status** - Real-time router status
- **PPPoE Users** - User management on routers

### Monitoring
- **Network Analytics** - Usage statistics and graphs
- **System Health** - Router and service monitoring
- **Performance Metrics** - Speed and uptime tracking

### User Management (Admin Only)
- **User List** - Manage system users
- **Role Management** - Assign roles and permissions
- **Access Control** - Role-based feature access

## 🔐 Authentication & Authorization

### JWT Authentication
- **Login/Logout** - Secure authentication flow
- **Token Storage** - Secure localStorage with automatic refresh
- **Session Management** - Automatic session handling

### Role-Based Access Control
- **Admin** - Full system access
- **Support** - Customer and technical support access
- **Accountant** - Billing and financial access

### Protected Routes
- **Route Guards** - Automatic access control
- **Permission Checks** - Feature-level permissions
- **Redirect Handling** - Seamless user experience

## 📊 Data Management

### React Query Integration
- **Automatic Caching** - Smart data caching
- **Background Updates** - Real-time data synchronization
- **Optimistic Updates** - Instant UI feedback
- **Error Handling** - Graceful error management

### API Service Layer
- **Centralized API Calls** - Consistent data fetching
- **Type Safety** - Full TypeScript integration
- **Error Handling** - Comprehensive error management
- **Request/Response Interceptors** - Automatic token handling

## 🎯 Form Handling

### React Hook Form
- **Performance** - Minimal re-renders
- **Validation** - Yup schema validation
- **Error Handling** - Comprehensive error display
- **Field Arrays** - Dynamic form fields

### Validation Schemas
- **Email Validation** - RFC compliant email validation
- **Phone Validation** - International phone number support
- **Password Validation** - Security requirements
- **Custom Validators** - Business logic validation

## 🚀 Deployment

### Docker Deployment

1. **Build the image:**
   ```bash
   docker build -t isp-admin-frontend .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:80 isp-admin-frontend
   ```

### Docker Compose

The frontend is included in the main `docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  ports:
    - "3000:80"
  depends_on:
    - backend
```

### Nginx Configuration

The frontend includes an nginx configuration for:

- **Static File Serving** - Optimized asset delivery
- **API Proxying** - Backend API integration
- **Gzip Compression** - Performance optimization
- **Security Headers** - Security hardening
- **React Router Support** - SPA routing

## 🔧 Development

### Code Quality

- **ESLint** - Code linting and formatting
- **TypeScript** - Type safety and IntelliSense
- **Prettier** - Code formatting (via ESLint)

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Workflow

1. **Feature Development** - Create feature branches
2. **Type Safety** - Ensure TypeScript compliance
3. **Testing** - Test components and functionality
4. **Code Review** - Submit pull requests
5. **Deployment** - Deploy to staging/production

## 🎨 Styling

### Global Styles
- **CSS Reset** - Consistent base styles
- **Typography** - Consistent font hierarchy
- **Color System** - Design token integration
- **Utility Classes** - Helper classes for common styles

### Component Styling
- **CSS Modules** - Scoped component styles
- **Design Tokens** - Consistent spacing and colors
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 AA compliance

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check backend server is running
   - Verify API base URL configuration
   - Check CORS settings

2. **Authentication Issues**
   - Clear localStorage and re-login
   - Check JWT token expiration
   - Verify backend authentication endpoints

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

### Debug Mode

Enable debug logging by setting:

```env
VITE_DEBUG=true
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Atomix Design System](https://github.com/Shohojdhara/atomix)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
