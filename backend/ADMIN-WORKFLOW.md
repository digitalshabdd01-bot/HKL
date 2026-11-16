# Admin review and publishing

Deploy the backend and run `python manage.py migrate` before using this update. Migration 0003 adds nullable audit fields; existing content and submissions are preserved. Imported drafts are not published automatically.

## Review content

Open `/admin/cms/content/`. Filter by kind, language, draft/published state or featured status. Content forms now group the main text, publishing settings, media, events, episode/issue details and edit history into sections.

Select reviewed records and choose **Publish selected content (validate first)**. Every selected draft is validated before any selected record is saved. If a draft event lacks a start date or another record fails validation, the entire publication selection stays unchanged and an error message appears. Future `publish_at` times remain scheduled; the public API only shows content whose publication time has arrived.

Use **Return selected content to draft** to hide content without deleting it. Republishing does not reset its publication time. Edit the time explicitly if you want to reschedule it.

The admin records the latest editor and latest publishing administrator. Unpublishing retains the last publisher for reference. Publication actions are also recorded in Django admin's change history. Staff need the corresponding change permission to use these actions; read-only staff cannot publish.

## Process enquiries

Open `/admin/cms/submission/`, filter contact/volunteer requests, and use **Mark selected enquiries as reviewed**, **Close selected enquiries**, or **Reopen selected enquiries**. The administrator and review time are recorded. Original name, email, message and consent remain read-only. These status changes do not send emails. Staff require change permission for submissions.

Audit identities are private administrative fields and are excluded from the public API. These fields track the latest actor; they are not a comprehensive immutable audit trail for direct database edits or scripts. Django admin change history supplies the additional per-action administrative record.

Database hosting and MySQL connection setup are still covered by `MYSQL.md`. No paid resources are created by this code update.
