
# School Fee Management System

A comprehensive web application built with React and Express for managing school fees, receipts, and student records.

## Features

- Dashboard with fee collection statistics and charts
- Receipt generation and management
- Student record management
- Fee structure configuration
- Transportation route management
- Excel import/export capabilities
- Defaulter tracking and reporting
- System settings and customization

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Shadcn UI
- Backend: Express.js, Node.js
- Database: PostgreSQL with Drizzle ORM
- Charts: Recharts
- PDF Generation: jsPDF
- Excel Processing: XLSX

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

The application will be available at http://0.0.0.0:5000

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend
- `/shared` - Shared TypeScript types and schemas

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript files
- `npm run db:push` - Update database schema

## Environment Variables

Configure the following in the Secrets tab:
- Database connection details
- Session secret
- Other sensitive configuration

## Deployment

The application can be deployed directly on Replit. Use the Deploy tab to publish your changes.
