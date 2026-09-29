# Site log — one row per domain

Fill in as each domain is done. `Zone` = on Cloudflare DNS and Active. Keep
secrets and account IDs out of this file.

| Domain | Type (new/old) | Zone | Routing (catch-all -> Worker) | Sending onboarded | DMARC checked | Tests passed | Date | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inmobiliaria.com.py | old | yes | yes (hola@, anton@; `mail.` catch-all) | `mail.` subdomain only (65 sent, 2026-09-29) | not yet on apex | partly | 2026-09-29 | Root sending needs `EMAIL_ROOT_SENDING=true` |
| realestateinparaguay.com | | | | | | | | |
| hospital.com.py | | | | | | | | founder decision needed on patient data |

## Pilot results

(Record: quota counting test — 1 or 3 per 3-recipient email; whether `_dmarc`
was overwritten; threading headers preserved; anything else that surprised you.)
