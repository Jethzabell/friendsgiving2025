# 🦃 Friendsgiving 2025 Hub

A collaborative web app for organizing Friendsgiving 2025 — manage attendees, dishes, shopping lists, and more!

Built with **SvelteKit**, **Firebase**, **Tailwind CSS**, and **DaisyUI**.

---

## ✨ Features

- **Google Sign-In** via Firebase Auth
- **Real-time attendee & dish management** with Firestore
- **Countdown timer** to Friendsgiving (November 23, 2025)
- **Kanban board** for dish status tracking
- **Shopping list**, **playlist embed**, and **photo album** links
- **Responsive design** with warm autumn theme
- **Public read / authenticated write** permissions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A **Firebase project** (free tier works great)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd friendsgiving2025
npm install
```

### 2. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** and follow the wizard
3. Once created, click the **web icon** (`</>`) to register a web app
4. Copy the Firebase config object

#### Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Under **Authorized domains**, add:
   - `localhost`
   - Your GitHub Pages domain (e.g., `<username>.github.io`)

#### Enable Firestore

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode** (we'll add rules next)
3. Choose a region close to your users

#### Deploy Firestore Rules

Copy the rules from `firestore.rules` in this repo, then:

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Paste the rules and click **Publish**

Or use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # select your project
firebase deploy --only firestore:rules
```

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Firebase config values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: enable seed button for initial data
VITE_SEED_ENABLED=true

# Optional: App Check (reCAPTCHA v3 site key)
# VITE_FIREBASE_APPCHECK_KEY=your_recaptcha_v3_site_key
```

> **Note:** These are **public** values—security is enforced by Firestore rules, not config secrecy.

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### 5. Seed Initial Data (Optional)

1. Sign in with Google
2. If `VITE_SEED_ENABLED=true`, you'll see a **"Run seed"** button at the bottom
3. Click it to populate sample attendees and dishes

---

## 📦 Deployment

### Option A: GitHub Pages (Static)

This project uses `@sveltejs/adapter-static` for GitHub Pages.

#### Setup

1. Push your code to a GitHub repo
2. Go to **Settings** → **Pages**
3. Set **Source** to **GitHub Actions**

#### Deploy

The included `.github/workflows/deploy.yml` workflow will:

- Build the site on every push to `main`
- Deploy to GitHub Pages automatically

Your site will be live at `https://<username>.github.io/<repo-name>/`

**Important:** Add your GitHub Pages URL to Firebase **Authorized domains** (see step 2 above).

### Option B: Firebase Hosting

```bash
firebase init hosting  # choose 'build' as public directory
npm run build
firebase deploy --only hosting
```

---

## 🔐 Security & Permissions

- **Anyone can view** attendees, dishes, and settings (read-only)
- **Only signed-in users** can add, edit, or delete data
- Firestore rules enforce these permissions server-side

### Firestore Rules Summary

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthed() { return request.auth != null; }

    match /attendees/{doc} {
      allow read: if true;
      allow create, update, delete: if isAuthed();
    }
    match /dishes/{doc} {
      allow read: if true;
      allow create, update, delete: if isAuthed();
    }
    match /settings/{doc} {
      allow read: if true;
      allow write: if isAuthed();
    }
  }
}
```

---

## 🛡️ App Check (Optional)

Firebase App Check protects your backend from abuse. To enable:

1. Go to **Firebase Console** → **App Check**
2. Register your app with **reCAPTCHA v3**
3. Copy the site key and add to `.env`:
   ```env
   VITE_FIREBASE_APPCHECK_KEY=your_recaptcha_v3_site_key
   ```
4. Deploy updated app

App Check is scaffolded but **disabled by default** until you provide a key.

---

## 🎨 Customization

### Theme

The autumn theme is defined in `tailwind.config.cjs`:

```javascript
daisyui: {
  themes: [
    {
      friendsgiving: {
        primary: '#ea580c',      // warm orange
        secondary: '#9a3412',
        accent: '#14b8a6',
        neutral: '#3f3127',
        'base-100': '#fdf7f0',   // cream background
        // ...
      }
    }
  ]
}
```

Adjust colors to match your vibe!

### Event Date

Update the countdown date in `src/routes/+page.svelte`:

```javascript
const eventDate = '2025-11-23T00:00:00-05:00';
```

---

## 📁 Project Structure

```
friendsgiving2025/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte components
│   │   ├── stores/            # Firestore data stores
│   │   ├── firebase.client.ts # Firebase initialization
│   │   └── types.ts           # TypeScript types
│   ├── routes/
│   │   ├── +layout.svelte     # Root layout (theme)
│   │   └── +page.svelte       # Main dashboard
│   ├── app.html               # HTML template
│   └── app.css                # Global styles
├── static/
│   └── cover.jpg              # Hero image
├── firestore.rules            # Firestore security rules
├── .github/workflows/
│   └── deploy.yml             # GitHub Pages deployment
├── tailwind.config.cjs
├── svelte.config.js
└── package.json
```

---

## 🧪 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run svelte-check (type checking)
```

---

## 🐛 Troubleshooting

### "Cannot find module" errors

Run `npx svelte-kit sync` to regenerate SvelteKit's internal files.

### Firebase Auth errors

- Check that your domain is in **Authorized domains** (Firebase Console → Authentication → Settings)
- Verify `.env` values match your Firebase project

### Firestore permission denied

- Ensure rules are deployed (`firebase deploy --only firestore:rules`)
- Sign in with Google to gain write access

### Build fails on GitHub Actions

- Check that you've added Firebase config as **repository secrets** (if using secrets instead of `.env`)
- Verify `adapter-static` is installed

---

## 📝 License

MIT — feel free to fork and customize for your own gatherings!

---

## 🙏 Acknowledgments

- **SvelteKit** for the blazing-fast framework
- **Firebase** for real-time backend magic
- **DaisyUI** for beautiful Tailwind components
- **Google Fonts** for Inter and Material Symbols

---

**Happy Friendsgiving! 🦃🍂**
