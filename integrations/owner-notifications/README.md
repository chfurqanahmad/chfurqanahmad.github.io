# Owner email notifications — prepared, not activated

Recipient: thisisfurqanahmad@gmail.com. No prospect emails are sent.

## Install in the existing Website Enquiries Apps Script project
1. Add a NEW Script file named Notifications and paste Notifications.gs into it. Keep existing Code.gs unchanged.
2. Replace appsscript.json with the manifest in this directory; save both files. If hidden, enable Show appsscript.json manifest file in editor under Project Settings.
3. While signed into thisisfurqanahmad@gmail.com, choose setupEnquiryNotifications from the function dropdown and click Run. Authorize spreadsheet access, email sending and trigger management.
4. The setup sends one confirmation email and installs one five-minute trigger. Running setup again does not create another trigger or repeat a successful confirmation email.
5. No web-app redeployment is needed for this separate scheduled function. Leave the existing public deployment unchanged.

## Behavior and verification
The process reads saved Enquiries rows and emails the owner with name, company, email, subject, goal, Chicago timestamp, submission reference and row link. Existing saved enquiries without a notification record are included. A separate Notification Log tab stores ID, status and send time; sorting the Enquiries tab cannot detach notification status from its ID. At most 20 messages per run, respecting available Google mail quota. Daily quota exhaustion defers pending entries. Mail service errors retry on the next run. A send that succeeds but cannot persist its receipt remains Sending: check inbox before manually changing this status to Retry, because automatic retries could duplicate an already-sent message.

Mail delivery and receipt storage cannot be atomic; exactly-once email delivery is not guaranteed. Sent means MailApp accepted the request, not that inbox delivery was independently confirmed. Schedule timing and Google quotas may delay notifications.

After installation, submit one synthetic enquiry through the website; verify its notification arrives and its ID is marked Sent. Let a subsequent scheduled run complete and verify no duplicate. Then remove only that test enquiry and its log entry. Do not mark this task complete before live verification.

To disable: remove the sendEnquiryNotifications time trigger in Apps Script's Triggers screen. The website continues saving enquiries.

Local validation: node scripts/check_notifications.cjs.
