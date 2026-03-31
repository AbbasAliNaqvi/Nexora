# Nexora

<p align="center">
  <strong>
    A platform for transforming application logic into scalable, API-driven SaaS products.
  </strong>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Backend-Express-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
  <img alt="Railway" src="https://img.shields.io/badge/Deploy-Railway-00e1ff?style=for-the-badge&logo=railway&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
</p>

---

## Live System

| Layer       | URL                                                   |
| ----------- | ----------------------------------------------------- |
| Frontend    | https://nexora-cloud.vercel.app/                      |
| Backend API | https://nexora-production-5cac.up.railway.app/api     |
| Gateway     | https://nexora-production-5cac.up.railway.app/gateway |

---
## Product Overview

Nexora provides a unified environment for designing, exposing, and managing APIs as scalable services. It abstracts infrastructure complexity and enables developers to convert application logic into deployable API products with built-in access control and monitoring.

---
## Capabilities

| System Area    | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| API Builder    | Define structured endpoints with mock and CRUD execution modes |
| Access Layer   | Issue and manage API keys for controlled access                |
| Gateway Engine | Centralized routing for all project-based API requests         |
| Analytics      | Visibility into request volume, latency, and errors            |
| AI Integration | Generate API structures from natural language input            |

---

## Interface

<p align="center">
  <img src="./docs/dashboard.png" width="900"/>
</p>

<p align="center">
  <img src="./docs/api-builder.png" width="900"/>
</p>

<p align="center">
  <img src="./docs/analytics.png" width="900"/>
</p>

---

## Architecture

```text
Client Interface
      ↓
Application Layer (/api)
      ↓
Gateway Layer (/gateway)
      ↓
Execution Engine
      ↓
Database Layer (MongoDB)
```

---

## System Design

```bash
client/
  interface layer (React)

server/
  controllers
  routing
  execution services
  gateway logic
```

---

## Positioning

Nexora is designed as a developer platform rather than a single-use application.
It focuses on enabling API-based product creation, bridging the gap between development and service deployment.

---

## Author

Abbas Ali Naqvi