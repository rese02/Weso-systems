# HotelHub Central - Software Architecture

This document outlines the software architecture and project structure for the HotelHub Central application. It is built using the Next.js App Router, Firebase, Genkit for AI, and ShadCN for UI components.

## Core Technologies

-   **Framework:** Next.js (with App Router)
-   **Styling:** Tailwind CSS with ShadCN UI
-   **Backend & Database:** Firebase (Firestore, Authentication, Storage)
-   **AI Integration:** Google Genkit
-   **Language:** TypeScript

## Project Structure Overview

The project is organized into several key directories within the `src/` folder, each with a specific responsibility.

```
/
├── src/
│   ├── app/                # Next.js App Router: All pages and routes
│   ├── components/         # Reusable React components (UI and logic)
│   ├── context/            # Global React contexts (e.g., Authentication)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Core logic, server actions, and Firebase configuration
│   ├── ai/                 # Genkit AI flows and configuration
│   └── ...                 # Other configuration files
├── firebase.json           # Firebase configuration for deployment and rules
├── firestore.rules         # Security rules for Firestore database
└── storage.rules           # Security rules for Firebase Storage
```

---

### `src/app` - Routing

This directory defines the entire routing structure of the application. Each folder represents a URL segment.

-   **/ (root)**: Redirects automatically to `/agency/login`.
-   **/agency/login**: The login page for the main agency (Weso Systems).
-   **/admin/**: The main dashboard for the agency after login.
    -   `/admin/page.tsx`: Displays the list of all managed hotels.
    -   `/admin/create-hotel`: A form for the agency to create a new hotel system.
    -   `/admin/security-advisor`: The AI-powered tool to generate security policies.
-   **/hotel/login**: The generic login page for all hoteliers.
-   **/dashboard/\[hotelId\]/**: The dashboard for a specific hotelier. The `[hotelId]` is dynamic.
    -   `/dashboard/[hotelId]/page.tsx`: The main dashboard overview for the hotel.
    -   `/dashboard/[hotelId]/settings`: Page for editing hotel-specific settings.
    -   `/dashboard/[hotelId]/bookings`: The main page for viewing and managing all bookings for the hotel.
    -   `/dashboard/[hotelId]/bookings/create-booking`: A form for the hotelier to manually create a new booking and generate a guest link.
    -   `/dashboard/[hotelId]/bookings/[bookingId]`: Detailed view of a single booking.
    -   `/dashboard/[hotelId]/bookings/[bookingId]/edit`: Form to edit an existing booking.
-   **/guest/\[linkId\]/**: The public-facing portal for guests to complete their booking.
    -   `/guest/[linkId]/page.tsx`: The main multi-step form for guests to enter their data, upload documents, and provide payment proof.
    -   `/guest/[linkId]/thank-you`: The confirmation page shown after a guest successfully submits their information.
    -   `/guest/privacy`: The privacy policy page.
    -   `/guest/terms`: The terms and conditions page.
-   **/api/**: Server-side API routes for handling authentication logic.
    -   `/api/auth/login`: Creates a server-side session cookie after successful Firebase client login.
    -   `/api/auth/logout`: Clears the server-side session cookie.

---

### `src/lib` - Core Logic & Data Handling

This is the brain of the application, containing all server-side logic and configurations.

-   **`lib/actions/`**: Contains all server actions (`'use server'`). These are secure, server-side functions that interact with the Firebase Admin SDK.
    -   `auth.actions.ts`: Simulates authentication checks (placeholder).
    -   `hotel.actions.ts`: Handles creating, reading, updating, and deleting hotel data.
    -   `booking.actions.ts`: Manages the entire booking lifecycle, including creating booking links, validating them, and updating booking data. **This file is critical for the guest booking flow.**
    -   `email.actions.ts`: Handles sending emails via SMTP.
-   **`lib/firebase-admin.ts`**: Initializes the Firebase Admin SDK for secure server-side operations.
-   **`lib/firebase.client.ts`**: Initializes the Firebase Client SDK for browser-side interactions (e.g., login, file uploads).
-   **`lib/definitions.ts`**: Contains all TypeScript types and Zod schemas for data validation (e.g., `Hotel`, `Booking`, `bookingFormSchema`).

---

### `src/components` - UI Library

This directory holds all reusable React components.

-   **`components/ui/`**: Contains the ShadCN UI components (Button, Card, Input, etc.).
-   **`components/booking/`**: Contains complex components specific to the booking process.
    -   `booking-form.tsx`: The multi-step form used by the guest.
    -   `booking-creation-form.tsx`: The form used by the hotelier to create a new booking.
-   **`components/dashboard-header.tsx`**: The header component for the dashboards.

---

### `src/ai` - Artificial Intelligence

This directory contains all logic related to Google Genkit.

-   **`ai/genkit.ts`**: Basic Genkit and Google AI plugin configuration.
-   **`ai/flows/`**: Contains the specific AI-powered workflows.
    -   `security-policy-advisor.ts`: The flow that generates security reports.
    -   `generate-confirmation-email.ts`: The flow that composes and generates the HTML for the booking confirmation email.

---

### Authentication and Security Flow

-   **Roles:** The system uses Firebase Custom Claims to define two roles: `agency` and `hotelier`.
-   **Login:** The app has two separate login portals (`/agency/login`, `/hotel/login`). Upon successful Firebase Authentication on the client, an ID token is sent to a server-side API (`/api/auth/login`), which verifies the token, checks for the correct role claim, and sets a secure, `httpOnly` session cookie.
-   **Authorization:** Middleware and server components use `verifyAuth` from `firebase-admin.ts` to validate the session cookie on every request, ensuring users can only access the data and routes they are permitted to see.
-   **Database Security:** `firestore.rules` and `storage.rules` provide the ultimate layer of security, defining data access rules directly on the Firebase backend, preventing any unauthorized data access regardless of client-side logic.
