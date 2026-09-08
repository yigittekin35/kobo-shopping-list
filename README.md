# Kobo Shopping List (Household List)

This project is a simple, robust shopping list application optimized specifically for E-Ink displays like the Kobo Nia (N306) and older/restricted web browsers, while also working perfectly on modern mobile phones. It runs on Vercel and uses a Supabase database.

## Features
- **E-Ink Compatible:** No animations, shadows, or transition effects. High-contrast design using pure black, white, and grayscale colors.
- **Legacy Browser Support:** Uses vanilla CSS and ES5 JavaScript. No React or modern JS frameworks. Even if JavaScript is disabled or fails, basic addition and logout operations can still work using native HTML forms.
- **Secure:** Login is performed using only a shared PIN code (Household PIN). Session-based authentication is used, and the database is accessed only via the server using a Supabase Service Role Key.

## Installation and Deployment Guide

### 1. Installing Dependencies
Ensure Node.js 22 or higher is installed (the `.nvmrc` file is set to 22).
```bash
npm install
```

### 2. Creating a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once your project is ready, navigate to the **SQL Editor** from the left menu.
3. Copy all the code from the `supabase/schema.sql` file in this project, paste it into the SQL Editor, and run it. This will create the `shopping_items` table and configure the necessary security rules.

### 3. Finding Environment Variables
Go to **Project Settings -> API** in the Supabase dashboard.
- Copy the **Project URL**. This is your `SUPABASE_URL`.
- Copy the `service_role` (secret) key under **Project API Keys**. This is your `SUPABASE_SERVICE_ROLE_KEY`.
  
> **SECURITY WARNING (CRITICAL):** Never share the `service_role` key, do not commit it to GitHub, and do NOT use it in frontend (browser) code! This key bypasses all database restrictions. In this project, it is used exclusively by the Vercel backend (API) functions.

### 4. Setting Local Environment Variables
Rename the `.env.example` file in the project directory to `.env` and fill it out:
```env
SUPABASE_URL=your_copied_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_copied_service_role_key
HOUSEHOLD_PIN=your_custom_pin_code
SESSION_SECRET=your_generated_long_random_string
```
*(Note: To create a strong `SESSION_SECRET`, you can run the following command in your terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

### 5. Running Locally
You can use the Vercel CLI to test the project locally:
```bash
npm i -g vercel
vercel dev
```
Test it by navigating to `http://localhost:3000` in your browser.

### 6. Setting Vercel Environment Variables
1. Go to the Settings of your project in the Vercel dashboard.
2. Open the **Environment Variables** tab.
3. Add the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HOUSEHOLD_PIN`, and `SESSION_SECRET` variables from your `.env` file one by one.

### 7. Connecting the GitHub Repository to Vercel
1. Push this code to a repository in your GitHub account (e.g., `kobo-shopping-list`).
2. In Vercel, click "Add New -> Project" and connect your GitHub account.
3. Select your `kobo-shopping-list` repository and click **Deploy**. There is no build step; it will be deployed instantly.

## Testing
- **Desktop:** Open the Vercel URL in any modern browser to use it seamlessly.
- **Mobile:** Open the Vercel URL on your phone and check the list.
- **Kobo Nia:** Open the Web Browser in the "Experimental Features" section of your Kobo and type in your Vercel URL.

## Troubleshooting
- **Kobo Caching:** The Kobo sometimes caches old data. You can press the "Refresh" button inside the app to pull fresh data from the server.
- **Javascript Limitations:** The Kobo browser does not support modern JavaScript. This project uses ES5. However, even if JS crashes completely, basic form submissions are designed to work using native `action` and `method` attributes.
- **Session/Cookie Issues:** If you cannot log in on the Kobo, check the browser settings to ensure cookies are accepted.

## Removing the App from Kobo
This app does not make any software changes or modifications to your Kobo device; it is just a website. 
If you want to remove/stop using it:
1. Close the open tab in the Kobo browser.
2. Go to the Kobo browser settings and select "Clear History" and "Clear Cookies" to delete any remaining session data related to the app.
