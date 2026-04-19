
The user wants a proper login experience. Currently `src/routes/admin.login.tsx` is the only auth page — basic email/password, mode toggle for signup, plain card. Let me design a richer auth system.

## Plan: Enhanced Auth Pages

### 1. Split into dedicated routes
Replace the single `/admin/login` toggle page with three dedicated routes:
- `/login` — Sign in (public, not admin-only)
- `/signup` — Create account
- `/forgot-password` — Request reset link
- `/reset-password` — Set new password (linked from email)

Keep `/admin/login` redirecting to `/login` for back-compat.

### 2. Shared `AuthLayout` component
New `src/components/AuthLayout.tsx` — split-screen layout:
- Left: branded panel with store logo (from settings), tagline, gradient background using primary color
- Right: form card (centered, max-w-md)
- Mobile: stacks (branded panel becomes a small header)
- Language switcher in top-right corner

### 3. Enhanced login page (`/login`)
- Email + password fields with icons (Mail, Lock from lucide)
- Show/hide password toggle (Eye/EyeOff)
- "Remember me" checkbox
- "Forgot password?" link
- Primary "Sign in" button with loading state
- Divider + "Don't have an account? Sign up" link
- After login: redirect to `?redirect=` search param or `/admin` if admin, else `/`

### 4. Enhanced signup page (`/signup`)
- Full name (optional, stored in user_metadata)
- Email
- Password with strength indicator (weak/medium/strong based on length + char classes)
- Confirm password (client-side match validation)
- Terms checkbox
- "Create account" button
- Link back to `/login`
- After signup: success state telling user to check email

### 5. Forgot + reset password
- `/forgot-password`: email field → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`, success state
- `/reset-password`: detects recovery token in URL, shows new password + confirm fields, calls `supabase.auth.updateUser({ password })`, redirects to `/login` on success

### 6. Account dropdown in Header
Update `src/components/Header.tsx`:
- If logged in: avatar dropdown (initials from email) with "Admin dashboard" (if admin), "Sign out"
- If logged out: "Sign in" link/button

### 7. Update AuthContext
Add to `src/contexts/AuthContext.tsx`:
- `resetPassword(email)` method
- `updatePassword(password)` method
- Optional `fullName` param on signUp (stored in `options.data`)

### 8. Update admin guard
`src/routes/admin.tsx` currently redirects to `/admin/login`. Update redirect to `/login?redirect=/admin`.

### Layout sketch
```text
┌─────────────────────────┬──────────────────────────┐
│                         │   [Lang switcher]        │
│   [Logo]                │                          │
│   Store name            │   Welcome back           │
│                         │   Sign in to continue    │
│   "Tagline / blurb"     │                          │
│                         │   [Email field]          │
│   gradient bg           │   [Password field 👁]    │
│   primary color         │   [✓ Remember]  [Forgot?]│
│                         │                          │
│                         │   [   Sign in   ]        │
│                         │   ─── or ───             │
│                         │   New here? Sign up      │
└─────────────────────────┴──────────────────────────┘
```

### Files
- New: `src/components/AuthLayout.tsx`
- New: `src/routes/login.tsx`
- New: `src/routes/signup.tsx`
- New: `src/routes/forgot-password.tsx`
- New: `src/routes/reset-password.tsx`
- Edit: `src/routes/admin.login.tsx` — replace with redirect to `/login`
- Edit: `src/contexts/AuthContext.tsx` — add reset/update password, fullName on signup
- Edit: `src/routes/admin.tsx` — redirect to `/login?redirect=/admin`
- Edit: `src/components/Header.tsx` — account dropdown

No DB changes, no new dependencies (uses existing shadcn Card, Input, Button, Checkbox, DropdownMenu, Avatar, lucide-react icons).
