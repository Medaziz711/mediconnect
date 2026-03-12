# Angular frontend for Gestion Médicale

## 1. Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node)

## 2. Create the Angular project

Open a terminal in your project folder (e.g. `c:\Users\12345\.cursor\src`) and run:

```bash
npx -y @angular/cli@18 new medical-frontend --routing --style=scss --ssr=false
```

When prompted:
- **Standalone components?** Yes (default)
- **Angular strict mode?** Yes or No (your choice)

This creates the folder **medical-frontend** with a full Angular app.

## 3. Go into the project and add HTTP client

```bash
cd medical-frontend
npm install
```

Angular 18 includes `HttpClientModule` via `provideHttpClient()` in the default app config. If your `app.config.ts` doesn’t have it, we’ll add it in the next step.

## 4. Copy the frontend files

The repo contains a **`frontend-src`** folder with ready-made Angular code.

1. **Environments:** Create `medical-frontend/src/environments/environment.ts` with:
   ```ts
   export const environment = { production: false, apiUrl: 'http://localhost:8081/api' };
   ```
2. **App code:** Copy the contents of `frontend-src/app/` into `medical-frontend/src/app/` (merge with existing files). Overwrite `app.config.ts`, `app.routes.ts`, and `app.component.ts` with the versions from `frontend-src/app/`.
3. See **`frontend-src/README.md`** for a step-by-step copy checklist.

Main pieces included:
- **Auth service** – login, register, logout, current user
- **Auth guard & admin guard** – protect routes
- **Login / Register components** – forms calling your API
- **Admin demandes** – list pending requests, accept/reject
- **Dashboard** – simple welcome page
- **Routing** – `/login`, `/register`, `/admin/demandes`, `/dashboard`

## 5. Run the backend and the frontend

**Terminal 1 – Backend (Spring Boot):**
```bash
cd c:\Users\12345\.cursor\src
mvn spring-boot:run
```

**Terminal 2 – Frontend (Angular):**
```bash
cd c:\Users\12345\.cursor\src\medical-frontend
ng serve
```

Open **http://localhost:4200** in the browser.

## 6. API base URL

The frontend calls **http://localhost:8081/api**. To change it, edit `medical-frontend/src/environments/environment.ts` (and `environment.development.ts` if present).

## 7. Suggested pages (routes)

| Route | Who | Description |
|-------|-----|-------------|
| `/login` | All | Login form |
| `/register` | All | Register (patient / doctor / pharmacist) |
| `/admin/demandes` | Admin | List and accept/reject requests |
| `/dashboard` | All | Simple home after login (role-specific later) |

You can add more pages (e.g. appointments, profile) later using the same services and guards.
