# Enquiry form draft — not deployed

Prepared 19 October 2026. This branch must not be merged until a working endpoint and private Google Sheet are configured and tested.

## Prepared
- Required name, company, email, subject and goal fields.
- Submit progress, accessible receipt/error messages, email fallback and mobile stacking.
- URL-encoded POST with a submissionId; retries of identical data reuse that ID.
- Success requires HTTP success plus JSON {"ok":true,"submissionId":"matching request ID"}.
- Failure/timeout preserves entered details. No opaque/no-cors response is treated as success.
- Draft privacy page describing Google Sheet storage; publish only when that flow is active.

## Task 5 dependency
Create the private `inhouse outreach` Drive folder and enquiry Sheet, then deploy a Google-hosted endpoint. The connected Drive tools currently do not deploy Apps Script web apps. Endpoint deployment/authorization must be resolved before activation.

Endpoint requirements: validate all field lengths, email and required fields server-side; check honeypot; reject abuse; save values as plain text (prevent spreadsheet formula injection); lock and deduplicate by submissionId; return a matching receipt only after the row is saved. Permit the portfolio's browser submission and verify redirect/CORS behavior in an actual browser. Never put credentials in public frontend code. Set form data-endpoint to the deployed HTTPS URL and regenerate script/style cache versions for any further edits.

Keep owner-notification and prospect-acknowledgement emails for the separately approved tasks. Do not promise an email was sent based only on a saved-row response.

## Activation gate
Submit synthetic data, verify exactly one Sheet row, retry the same ID, verify no duplicate, test invalid fields and a failed/timeout response, confirm mobile/keyboard behavior, then merge and verify the live flow. Remove only the known synthetic test rows.

Local checks: node scripts/check_interactions.cjs; python scripts/check_site.py.
