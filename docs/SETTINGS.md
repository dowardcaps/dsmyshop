# Settings (`/settings`)

| Section | What it does | Code |
| --- | --- | --- |
| Profile | Edit the display name (email is read-only). The layout reads the name from the database, so a rename shows in the sidebar at once. | `components/settings/profile-card.tsx`, `hooks/use-profile-form.ts` |
| Password | Verifies the current password, then stores a new bcrypt hash (min 8 characters). | `password-card.tsx`, `lib/settings/service.ts` |
| Preferences | Light / Dark / System theme. Currency (₱) and time zone (Asia/Manila) are fixed and shown read-only. | `preferences-card.tsx` |
| Employees | Add, edit and delete the people on the Salary tab (replaces the hard-coded defaults, which only seed the first visit). | `employees-card.tsx`, `employee-dialog.tsx`, `lib/settings/service.ts` |
| Shortcuts | Links to Expense categories and the Price list. | `app/(app)/settings/page.tsx` |

## Employee rules
- Pay dates are the 15th and 30th, from the "first salary month" through the current month (created automatically).
- Changing the monthly salary only updates pay dates that are **unpaid and have no advances**. Paid or advanced pay dates keep their amount, so past records and net income never change silently.
- An employee with paid salaries or advances can't be deleted. The last remaining employee can't be deleted either (the Salary tab would re-seed the defaults).
- Names are unique per owner, case-insensitive.

Server actions live in `lib/actions/settings.ts`, validation in `lib/validation/settings.ts`.

## Hiding the side menu (desktop)
The sidebar has a **Hide menu** button in its top corner. When hidden, the page uses the full screen width and a slim bar with a **Show menu** button appears on top. The choice is remembered in a cookie (`ds-sidebar`), so it stays the same on every page and after a refresh. On phones the menu is still the hamburger button. Code: `src/components/layout/{sidebar-state,sidebar-panel,app-frame,app-main}.tsx`, `src/lib/sidebar.ts`.
