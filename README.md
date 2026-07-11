# Task Manager API

A TypeScript REST API for user authentication and personal task management. It uses Express, Prisma, PostgreSQL, JWT access tokens, and bcrypt password hashing.

## Features

- Register, log in, and log out users
- JWT-protected task endpoints
- Create, list, update, and delete only your own tasks
- Input validation and consistent HTTP status codes
- Automated API tests with Vitest and Supertest

## Requirements

- Node.js 20 or later
- PostgreSQL database

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/task_manager"
JWT_SECRET="use-a-long-random-secret"
PORT=3000
JWT_EXPIRES_IN="1h"
```

Apply the database migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:3000` by default.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and receive an access token |
| `POST` | `/auth/login` | Log in and receive an access token |
| `POST` | `/auth/logout` | Log out on the client (`204 No Content`) |

Register or log in with:

```json
{
  "name": "Rohit",
  "email": "rohit@example.com",
  "password": "secure-password"
}
```

Passwords must be between 8 and 72 bytes. A successful register or login response includes a JWT token:

```json
{
  "message": "Login successful.",
  "token": "<access-token>",
  "user": {
    "id": 1,
    "name": "Rohit",
    "email": "rohit@example.com"
  }
}
```

### Tasks

All task routes require this header:

```http
Authorization: Bearer <access-token>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/tasks` | List the authenticated user's tasks |
| `POST` | `/tasks` | Create a task |
| `PUT` | `/tasks/:id` | Update one of your tasks |
| `DELETE` | `/tasks/:id` | Delete one of your tasks |

Example task payload:

```json
{
  "title": "Finish the API",
  "description": "Add the remaining endpoints",
  "completed": false
}
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with automatic reloads |
| `npm test` | Run the API test suite |
| `npm run typecheck` | Type-check the TypeScript source |

## Testing

The tests mock Prisma, so PostgreSQL is not required to run them:

```bash
npm test
```
