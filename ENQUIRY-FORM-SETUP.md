# Website enquiry integration

The contact form sends name, company, email, subject and goal to a Google Apps Script web app. The private Website Enquiries sheet is in the owner's inhouse outreach folder.

Endpoint: https://script.google.com/macros/s/AKfycbzv8DxALM71xyJB4lYWFgNbNkcfZrEVuXGPzyhjkvFIR3tcJkD7jfrfono8dwvquNib/exec

Apps Script settings: execute as owner; access Anyone; SPREADSHEET_ID script property points to the private sheet; timezone America/Chicago. The public endpoint does not return sheet rows. No credentials are stored in the website.

Backend validation checks required fields, lengths, email, UUID and honeypot. Writes are locked, retry IDs are deduplicated and text is apostrophe-escaped to prevent formula interpretation. Receipt is returned after the row is saved. Simple quota limits are 30 requests/minute overall and 5/hour/email.

Frontend requires a matching JSON receipt, preserves inputs on failure and reuses the ID for unchanged retries. Request timeout is 60 seconds. Email fallback remains available.

Validation 19 October 2026: live save and matching receipt passed; leading-equals text stored as text; retry returned the same receipt without another row; incomplete request rejected. Local interaction, backend and static site checks passed.

Owner notifications and prospect acknowledgements were enabled on 20 October 2026. The updated code attempts owner notification and then acknowledgement immediately after saving, with the existing scheduled jobs as retry backups. Both send logs deduplicate by submission ID; acknowledgements additionally require a matching Sent owner record and preserve the 24-hour per-address cap. This immediate-dispatch update still requires replacing the three Apps Script files and redeploying the existing web app. Sent means accepted by Google, not confirmed inbox delivery or inbox ordering.

For backend updates: paste integrations/apps-script/Code.gs into Apps Script, save, and use Deploy > Manage deployments > Edit > New version > Deploy, preserving the endpoint URL.

## Immediate ordered email update
Replace Code.gs, Notifications.gs and Acknowledgements.gs with their corresponding repository files. Keep the existing manifest with spreadsheets, script.send_mail and script.scriptapp scopes; the canonical manifest in integrations/apps-script now matches these approved scopes. Save all files, then Deploy > Manage deployments > Edit > New version > Deploy. Do not create new triggers or a new endpoint.

Expected flow: save and flush row, release save lock, send owner email, record Sent, send client acknowledgement only after checking the matching owner Sent record. Request timeout remains 60 seconds; a retry reuses the submission ID, avoiding duplicate rows and already-logged messages. If the owner email fails or its receipt is uncertain, the client acknowledgement waits. Scheduled retries may take five minutes or longer. Submission order does not guarantee inbox arrival order.

Delivery uses Google's MailApp under the authorized Gmail account, with truthful sender names, fixed plain-text client copy, a valid reply-to, no attachments, no tracking pixels and conservative acknowledgement limits. Receiving providers still control spam classification.

## Form refinement — prepared 20 October 2026
Company is optional on both the form and backend. Email label accepts personal or company email. Subject is a required dropdown with eight choices, including general enquiries.

The frontend POSTs action=save and displays success only after a matching saved-row receipt. It then starts a separate keepalive POST with action=deliver using the same payload and UUID; the server's existing deduplication finds the already-saved row and sends the owner notification before the client acknowledgement. The interface does not wait for that delivery request. Existing five-minute jobs remain a fallback if the second request cannot complete. Old clients without action retain the previous save-and-send behavior.

Activation: replace only Code.gs in the existing Apps Script project and deploy a new version at the same endpoint. Then publish this branch's index.html and assets/js/main.js. Do not publish the optional-company form before backend activation, because the old backend rejects empty company. Local checks passed: optional company accepted; save-only causes no emails; delivery retry preserves one row and correct sending order; UI completes while the delivery request is still pending; receipt mismatches/failures do not dispatch emails; static links and metadata pass. Live verification is pending deployment.

Gmail spam placement remains unresolved. Obtain SPF, DKIM and DMARC results and any displayed Gmail spam reason from an affected client's message before changing sender infrastructure. No DNS or authentication claims are made from the send logs alone.
