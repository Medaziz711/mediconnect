# Medical Platform Frontend

Angular frontend for the Medical Pharmacy Platform. Connects to the Spring Boot backend at `http://localhost:8081/api`.

## Features

- **Multi-role Authentication**: Login/Register as Patient, Médecin (Doctor), or Pharmacien (Pharmacist)
- **Google OAuth Integration**: Médecins and Pharmaciens can login with Google to receive email notifications when their account is approved
- **Admin Approval System**: Médecins and Pharmaciens require admin approval before accessing the platform
- **Doctor Ratings**: Star-based rating system for doctors
- **Pharmacy Search**: Distance-based pharmacy search with location services
- **Professional UI**: Modern, responsive design with smooth animations

## Prerequisites

- **Backend must be running** at `http://localhost:8081`
- Start backend: `cd ../src && mvn spring-boot:run`
- Node.js and npm installed

## Google OAuth Setup

To enable Google Sign-In for Médecins and Pharmaciens:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins: `http://localhost:4200`
6. Copy your Client ID
7. Update `src/environments/environment.ts` and `src/environments/environment.prod.ts`:
   ```typescript
   googleClientId: 'YOUR_ACTUAL_CLIENT_ID_HERE'
   ```

## Development server

```bash
ng serve
```

Open `http://localhost:4200/` in your browser. You'll be redirected to the authentication page.

## Project structure

- `src/environments/` - API base URL and Google OAuth config
- `src/app/core/services/api.service.ts` - All backend API calls (login, register, appointments, etc.)
- `src/app/pages/auth/` - Login and registration page with role selection
- `src/app/pages/dashboard/` - Role-based dashboard
- `src/app/components/doctor-rating/` - Doctor rating component with stars
- `src/app/components/pharmacy-search/` - Pharmacy search with distance calculation

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
