# nishu.dev.api

[![Runtime](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff&color=000)](https://bun.sh)
[![Framework](https://img.shields.io/badge/Fastify-000?logo=fastify&logoColor=000&color=yellow)](https://www.fastify.io)
[![Language](https://img.shields.io/badge/TypeScript-000?logo=typescript&color=0f0fff&logoColor=fff)](https://www.typescriptlang.org)
[![Documentation](https://img.shields.io/badge/Swagger-OpenAPI-green?logo=swagger)](/docs)

## About

`nishu.dev.api` is the backend service powering **[nishu.dev](https://nishu.dev)**. It is a lightweight, high-performance REST API built using **Fastify** and **TypeScript**, running on the modern **Bun** runtime. The service serves static portfolio configurations, project listings, developer biographies, and certifications dynamically to the frontend client, and features integrated interactive API documentation via Swagger UI.

---

## Key Features

- **Blazing Fast Performance**: Powered by the Bun runtime and Fastify, providing minimal latency and high throughput.
- **Auto-generated Documentation**: Full OpenAPI/Swagger documentation generated dynamically and accessible interactively at `/docs`.
- **Structured Response Format**: Standardized structure for success and error payloads.
- **Robust Error Handling**: Dedicated custom error classes (`ValidationError`, `UnauthorizedError`, `NotFoundError`, etc.) with a global error handler.
- **CORS Configured**: CORS enabled out-of-the-box for frontend integration.
- **Clean Architecture**: Standard model-view-controller (MVC) structure optimized for Fastify plugins and routing.

---

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Fastify](https://www.fastify.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Documentation**: [@fastify/swagger](https://github.com/fastify/fastify-swagger) & [@fastify/swagger-ui](https://github.com/fastify/fastify-swagger-ui)
- **Security**: [@fastify/cors](https://github.com/fastify/fastify-cors)
- **Formatting**: [Prettier](https://prettier.io/)

---

## Folder Structure

```
├── src/
│   ├── app.ts                 # Fastify app definition & global error handlers
│   ├── index.ts               # Server startup & graceful shutdown controls
│   ├── config/                # Environment & server/Swagger configurations
│   │   ├── envConfig.ts       # DOTENV loader and system variables
│   │   └── serverConfig.ts    # Fastify server plugins and routes registration
│   ├── controllers/           # Route handler controllers (e.g., authController.ts)
│   ├── data/                  # Hardcoded developer & project configuration data
│   │   └── index.ts           # Portfolio data payload
│   ├── routes/                # API routes definition
│   │   ├── public/            # Public routes (health, ping, portfolio)
│   │   └── v1/                # Versioned API routes (extensible)
│   └── utils/                 # Utility files
│       ├── common/            # Success/error response wrappers & async handlers
│       └── errors/            # Custom AppError classes
├── .env.example               # Template environment variables
├── package.json               # Node/Bun dependencies & scripts
├── tsconfig.json              # TypeScript compilation setup
└── README.md                  # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your local machine.


## API Reference

### Root Endpoint

- **Path**: `GET /`
- **Description**: Returns server state, process uptime, and link to interactive documentation.
- **Response Example**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Server Fired Up",
    "data": {
      "Uptime": 20.35,
      "Date": "7/20/2026, 10:53:30 AM",
      "Documentation": "/docs"
    }
  }
  ```

### Health Check

- **Path**: `GET /health`
- **Description**: Verifies that the API server is healthy.
- **Response Example**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Server Healthy",
    "data": 200
  }
  ```

### Ping

- **Path**: `GET /ping`
- **Description**: Simple ping-pong endpoint.
- **Response Example**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "pong",
    "data": "pong"
  }
  ```

### Portfolio Data

- **Path**: `GET /portfolio`
- **Description**: Retrieves full data configuration used to build the nishu.dev website. Includes developer profile, projects list, skills, experience, and certifications.
- **Response Example**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Portfolio fetched successfully",
    "data": {
      "developer": {...}
    }
  }
  ```

### Interactive Documentation

- **Path**: `GET /docs`
- **Description**: Accesses the Swagger UI representation of all routes and parameter configurations.

---

## Response Formatting Standard

All endpoints return a standardized JSON structure.

### Success Payloads

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message goes here",
  "data": { ... },
  "details": { ... }
}
```

### Error Payloads

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "errors": {
    "name": "NotFoundError",
    "details": {},
    "stack": "Error: Resource not found\n    at new NotFoundError..."
  }
}
```

_(Note: `stack` trace is only returned when `NODE_ENV` is set to `development`.)_

---

## Author

- **Nishan Rajak (Nishu)**
- **GitHub**: [@nishuR31](https://github.com/nishuR31)
