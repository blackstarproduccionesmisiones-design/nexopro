# Security Specification — Dinámico Pro

## 1. Data Invariants
1. **Admin Authority**: Only verified administrator accounts (`blackstarproducciones.misiones@gmail.com` with `email_verified == true` or registered `/admins/{uid}`) may create/delete clients, batches, or reassign plaque ownership.
2. **User Profile & Role Integrity**: Users may create their own `/users/{uid}` profile ONLY with `role == 'client'` (or `'admin'` strictly if `isAdmin()`), never self-escalating to `'admin'` or changing their `clientId` after creation.
3. **Tenant Isolation (Client Portal)**: A client user can `get`, `list`, and update ONLY `batches`, `plaques`, `routes`, and `scans` whose `clientId` matches their verified `/users/{uid}.clientId`.
4. **Update Scope Enforcement**: Client users updating a plaque may modify ONLY `['label', 'targetUrl', 'status', 'updatedAt']`, preserving immutable `serialCode`, `slug`, `batchId`, `clientId`, `ownerUid`, and `createdAt`.
5. **Public Route Non-PII Isolation**: `/routes/{slug}` contains strictly routing metadata (`slug`, `plaqueId`, `targetUrl`, `status`, `redirectCode`, `updatedAt`) with `allow get: if isValidId(slug); allow list: if false;` so the Express `/qr/:slug` HTTP 301 router can resolve single slugs without exposing any client PII or permitting collection scraping.
6. **Temporal Integrity & Size Bounds**: Every string field enforces `.size()` limits matching `firebase-blueprint.json`, every document ID satisfies `^[a-zA-Z0-9_\-]+$`, and timestamps enforce `request.time` on user mutations.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Assigned Admin Role**: `POST /users/{uid}` with `{ role: "admin" }` by a regular user -> `PERMISSION_DENIED`.
2. **Privilege Escalation Update**: `PATCH /users/{uid}` changing `role` from `"client"` to `"admin"` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Plaque Read**: Client A calls `getDoc(/plaques/plaque_of_client_B)` -> `PERMISSION_DENIED`.
4. **Blanket Client List Scraping**: Regular client executes `getDocs(/clients)` -> `PERMISSION_DENIED`.
5. **Cross-Tenant Plaque Redirect Hijack**: Client A updates `/plaques/plaque_B` `targetUrl` -> `PERMISSION_DENIED`.
6. **Immutable Slug Tampering by Client**: Client A updates their own plaque trying to change `slug` or `clientId` -> `PERMISSION_DENIED`.
7. **Shadow Ghost Field Injection**: Admin or Client creates/updates a plaque with `{ isFreeForever: true }` -> `PERMISSION_DENIED`.
8. **Unverified Email Spoofing**: Unauthenticated or `email_verified == false` token attempting admin write -> `PERMISSION_DENIED`.
9. **ID Poisoning**: Creating `/plaques/<2000-char-id>` or `/routes/bad$slug` -> `PERMISSION_DENIED`.
10. **Payload Size Exhaustion**: Writing a 50KB `targetUrl` or `notes` string -> `PERMISSION_DENIED`.
11. **Routes Collection Scraping**: Unauthenticated or client user executing `getDocs(/routes)` (`list`) -> `PERMISSION_DENIED`.
12. **Fake Timestamp Forgery by Client**: Client logging a scan with `scannedAt` backdated 30 days -> `PERMISSION_DENIED`.
