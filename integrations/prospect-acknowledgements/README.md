> Update 20 October: the initial scheduled version was activated and verified in the delivery logs. Updated scripts now support immediate dispatch from doPost and require a matching Sent owner-notification record before acknowledgement. Replace all three existing script files, then deploy a new version of the existing web app. This update is prepared and locally tested; live verification follows deployment. Existing triggers remain as backups.

# Prospect acknowledgements — prepared, activation pending

Add Acknowledgements.gs as a new Script file named Acknowledgements in the existing Website Enquiries Apps Script project. Keep Code.gs, Notifications.gs and the already-authorized manifest unchanged. Save, choose setupEnquiryAcknowledgements and Run once under thisisfurqanahmad@gmail.com. No web-app redeployment is needed. The setup creates one five-minute trigger and sends the owner a confirmation containing the prospect email copy.

Only enquiries received after initial setup are eligible; older rows are not emailed. Every acknowledgement uses a plain-text template personalized with the submitted name and subject, the submitted email as its sole recipient, the sender name Furqan Ahmad, and reply-to thisisfurqanahmad@gmail.com. Names and subjects are length-bounded and normalized to one line. The goal is not repeated. The website link and automatic-confirmation footer are removed at the owner’s request. No marketing list subscription is created.

Subject: Thanks for getting in touch | Furqan Ahmad

Hi [Name],

I hope you’re doing well. Thank you for your enquiry about “[Subject].” I’ll review the details, prepare a proposed scope, and get back to you shortly.

Best,
Furqan Ahmad

## Delivery controls
One acknowledgement per address per rolling 24 hours; 50 total per rolling 24 hours; at most 20 per run, reserving 20 remaining Google mail recipients for owner alerts. Invalid, multiple-recipient and reserved test addresses are skipped. Lower quota leaves eligible rows pending. Mail errors retry on the next run; successful sends are recorded by submission ID in Acknowledgement Log. Sending without a final receipt requires checking delivery before retrying manually. Mail delivery and log persistence cannot be atomic, so exactly-once delivery is not guaranteed.

Owner alerts remain independent and include all saved enquiries, even when a repeat prospect acknowledgement is suppressed. Scheduling and quota restrictions can delay delivery beyond five minutes.

## Verification
After setup, submit a synthetic enquiry using the owner's real email address (not example.com). Confirm a Sent entry in Acknowledgement Log and receipt in the owner's inbox. Confirm the existing owner notification also runs. Local test: node scripts/check_acknowledgements.cjs. Do not declare inbox delivery verified merely from a Sent status. Keep the test log receipt until the 24-hour deduplication window passes, or use an isolated test address for future tests.

Disable by deleting only the sendEnquiryAcknowledgements trigger. The enquiry form and owner alerts continue working.
