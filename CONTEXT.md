# px.ar — URL Shortener

A URL shortener that maps random or custom codes to destination URLs. Authenticated users own permanent, deletable links with custom paths. Anonymous users get auto-generated codes that expire after 3 months.

## Language

**Short URL**:
A unique path segment (`/{code}`) that redirects to a stored destination URL.
_Avoid_: alias, link, shortened link

**Code**:
The path segment that identifies a Short URL. Either auto-generated (5 chars, `A-Za-z0-9-_`) or a custom path chosen by an authenticated user (3-15 chars, same charset).
_Avoid_: slug, key, token, alias

**Destination URL**:
The long http(s) URL stored behind a Code. Validated at creation time.
_Avoid_: target, long URL, original URL

**Entry**:
A single row in the `urls` table: one Code, one Destination URL, optionally owned by a user.
_Avoid_: record, mapping, row

**Owner**:
A Supabase Auth user who created an Entry. Entries with an Owner never expire and can be deleted by the Owner.
_Avoid_: creator, author

**Anonymous Entry**:
An Entry with no Owner. Auto-generated Code, 3-month expiry from creation, never adoptable to an account.
_Avoid_: guest entry, unowned link

**Expired Entry**:
An Anonymous Entry past its 3-month expiry. Returns 410 Gone. The Code is permanently retired and never reused.
_Avoid_: dead link, stale entry

**Deleted Entry**:
An Entry removed by its Owner. The Code is freed and may be reused for a future Entry.
_Avoid_: removed link

**Custom Path**:
A user-chosen Code (3-15 chars, `A-Za-z0-9-_`). Auth-only. First-come, first-served. Reserved paths (`/api`, `/login`, etc.) are blocked.
_Avoid_: custom alias, vanity URL

**Blacklist**:
A file-based list of domain suffixes. Any Destination URL whose hostname matches a blacklist entry is rejected at creation time.
_Avoid_: blocklist, deny list

**QR Code**:
A client-side generated visual representation of a Short URL. Displayed inline with a download option.
_Avoid_: QR, barcode
