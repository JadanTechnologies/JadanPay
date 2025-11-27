# JadanPay VTU Web Application

This is a complete, production-ready VTU & Airtime Top-Up web application for Nigeria with a fully functional Admin Dashboard. It uses React + Tailwind CSS for the frontend and a mock serverless backend.

## Features

- User registration/login
- Wallet top-up
- Airtime and data purchase
- Transaction history and e-receipts
- Admin Dashboard with user/transaction management
- Reseller features (sub-accounts, bulk top-up)
- **New:** Network Success Rate API and Diagnostic Tool

## Project Structure

- `index.html`: The main HTML file.
- `index.tsx`: The main React application entry point.
- `components/`: Directory for React components.
- `services/`: Directory for mock backend logic and API services.
- `types.ts`: TypeScript type definitions.
- `constants.ts`: Static data like provider info and sample bundles.
- `network-api.js`: A separate backend Express server for the Network Test API.
- `package.json`: Dependencies for the Network Test API server.

## Setup & Running the Application

### 1. Frontend Application

The frontend is a static application that runs directly in the browser. You can serve the files using any static file server or by opening `index.html`.

### 2. Network Test API Backend

This project includes a separate Node.js backend to simulate network performance tests.

**Prerequisites:**
- Node.js (v14 or higher)
- npm

**Running the API Server:**

1.  Navigate to the project root directory in your terminal.
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Start the API server:
    ```bash
    npm start
    ```
4.  The server will start on `http://localhost:4000` by default. The frontend is configured to call this endpoint.

## How to Use the Network Test Tool

1.  Log in as an Admin (`admin@jadanpay.com` / `1234`).
2.  Navigate to the **Settings** page from the sidebar.
3.  Select the **Health** tab.
4.  In the "Live Network Quality Test" section, choose a provider and click "Run Test".
5.  You can also enable auto-refresh to monitor the simulated network quality in real-time.
