# Astro Finance Backend

A MongoDB-based backend API for the Astro Finance expense tracking application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your actual configuration:

   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Adjust other settings as needed

4. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Expenses

- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Database Schema

### User

- `_id`: ObjectId
- `email`: string (unique)
- `password`: string (hashed)
- `name`: string
- `createdAt`: Date
- `updatedAt`: Date

### Expense

- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `amount`: number
- `category`: string
- `date`: Date
- `notes`: string
- `createdAt`: Date
- `updatedAt`: Date

## Development

- Use `npm run dev` for development with hot reload
- Use `npm run build` to compile TypeScript
- Use `npm start` to run the compiled application
- Use `npm test` to run tests

## Environment Variables

- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRES_IN`: JWT expiration time
- `FRONTEND_URL`: Frontend URL for CORS
