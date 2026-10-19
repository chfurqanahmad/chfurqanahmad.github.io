# Website enquiry integration

The contact form sends name, company, email, subject and goal to a Google Apps Script web app. The private Website Enquiries sheet is in the owner's inhouse outreach folder.

Endpoint: https://script.google.com/macros/s/AKfycbzv8DxALM71xyJB4lYWFgNbNkcfZrEVuXGPzyhjkvFIR3tcJkD7jfrfono8dwvquNib/exec

Apps Script settings: execute as owner; access Anyone; SPREADSHEET_ID script property points to the private sheet; timezone America/Chicago. The public endpoint does not return sheet rows. No credentials are stored in the website.

Backend validation checks required fields, lengths, email, UUID and honeypot. Writes are locked, retry IDs are deduplicated and text is apostrophe-escaped to prevent formula interpretation. Receipt is returned after the row is saved. Simple quota limits are 30 requests/minute overall and 5/hour/email.

Frontend requires a matching JSON receipt, preserves inputs on failure and reuses the ID for unchanged retries. Request timeout is 60 seconds. Email fallback remains available.

Validation 19 October 2026: live save and matching receipt passed; leading-equals text stored as text; retry returned the same receipt without another row; incomplete request rejected. Local interaction, backend and static site checks passed.

No owner notification or prospect acknowledgement emails are enabled; those are separate tasks.

For backend updates: paste integrations/apps-script/Code.gs into Apps Script, save, and use Deploy > Manage deployments > Edit > New version > Deploy, preserving the endpoint URL.
