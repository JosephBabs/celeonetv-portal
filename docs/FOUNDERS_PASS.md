# Cele One Founder's Pass

## Public Routes

- `/founders`
- `/founders/activate`
- `/founders/dashboard`
- `/founders/pass`
- `/founders/certificate`
- `/founders/benefits`
- `/founders/invitations`
- `/founders/events`
- `/founders/announcements`
- `/founders/wall`
- `/founders/verify/:founderId`

## Admin Route

- `/admin/founders`

## Firestore Collections

- `founderApplications`
- `founderPayments`
- `founders`
- `founderBenefits`
- `founderInvitations`
- `founderAnnouncements`
- `founderAuditLogs`

## Environment Variables

Frontend:

```env
VITE_CHARIOW_FOUNDERS_PASS_URL=
VITE_FOUNDERS_SUPPORT_EMAIL=
VITE_FOUNDERS_VERIFICATION_BASE_URL=
```

Backend / Cloudflare Functions:

```env
CHARIOW_API_KEY=
CHARIOW_WEBHOOK_SECRET=
CHARIOW_PRODUCT_ID=
```

## Manual Verification Workflow

1. Supporter buys the Founder's Pass on Chariow.
2. Chariow delivers the initial digital product/receipt.
3. Supporter signs into Cele One and opens `/founders/activate`.
4. Supporter submits the Chariow order reference and payment details.
5. Application is stored as `pending` in `founderApplications`.
6. Admin opens `/admin/founders`.
7. Admin compares the activation data with the Chariow dashboard.
8. Admin approves or rejects the application.
9. Approval creates:
   - `founderPayments`
   - `founders`
   - public Founder ID, e.g. `COF-2026-000001`
   - QR verification token
   - audit log entry

No PDF, screenshot, receipt, or certificate alone grants access.

## Chariow Integration Still Required

- Confirm Chariow webhook signature header name and HMAC payload format.
- Configure `CHARIOW_WEBHOOK_SECRET`.
- Configure `CHARIOW_PRODUCT_ID`.
- Add trusted server-side Firebase Admin persistence for verified webhook events.
- Map Chariow fields to `founderPayments`.
- Turn the current `/api/webhooks/chariow` scaffold from validation-only into persistence + idempotent payment matching.

## Security Notes

Privileged operations must be protected by Firebase rules and/or trusted backend code. The current portal admin page uses existing frontend admin routing patterns, but production approval should be enforced by Firestore rules or server-side verification.

Recommended rule model:

- Users create/read their own `founderApplications`.
- Users read their own `founders` and `founderInvitations`.
- Public users read only active Founder Wall fields and verification-safe Founder fields.
- Admins manage applications, payments, founders, benefits, invitations, announcements, and audit logs.
- Users cannot write `founderPayments`, approve themselves, change Founder IDs, or change Founder levels.

## Founder Levels

Configured centrally in `src/lib/config.ts`:

- Supporter: 1,000 FCFA+
- Builder: 5,000 FCFA+
- Pioneer: 25,000 FCFA+
- Legacy: 100,000 FCFA+
