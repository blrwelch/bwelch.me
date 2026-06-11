# Portfolio Request: Response Workflow

A quick checklist for when a "Portfolio Request" email lands in your inbox.

---

## One-time setup (do this first)

- [ ] **Activate FormSubmit.** Open any case study page on the deployed site, submit the form with your own info. FormSubmit will email you a confirmation link. Click it. From that point on, all forms deliver to `blrwelch@gmail.com`. (If you skip this step, real requests will silently fail.)
- [ ] **Create your master case study PDFs** with no password set yet. One per case study: `cspire-case-study.pdf`, `autozone-case-study.pdf`, `ai-insights-dashboard-case-study.pdf`, `healthcare-ipad-case-study.pdf`, `ai-practice-case-study.pdf`. Keep these masters in a safe folder. You'll watermark and password-protect a copy per request.
- [ ] **Pick your C Spire shared password** (e.g., `cspire-portfolio-2026`). Same password for everyone who requests it. Lower sensitivity, oldest work, much of it public anyway.

---

## When a request arrives

The subject line tells you everything: `Portfolio Request | [Case Study] | [Name] ([Company])`.

### If the request is for **C Spire**:
1. Attach `cspire-case-study.pdf` (the pre-password-protected version with the shared password).
2. Reply with one line + the password in the body:
   > Hi [Name], attaching the C Spire case study. Password: `cspire-portfolio-2026`. Happy to chat further; let me know.
3. Done. (~2 min.)

### If the request is for **AutoZone, the AI Insights Dashboard, Healthcare iPad, or AI Practice** (sensitive):
1. **Open the master PDF** for that case study in Preview (Mac) or Acrobat.
2. **Watermark** every page with the recipient's name and company. In Preview: `Tools → Annotate → Text`, type "Prepared for [Name], [Company]. Confidential", repeat on each page. *(Acrobat does this in one step under Edit → Watermark → Add.)*
3. **Generate a unique password.** Keep it simple but specific. Pattern: `firstname-companyabbrev-month`. Examples:
   - `jane-acme-may`
   - `marcus-pied-piper-jun`
   - `rita-att-may`
   - If they didn't provide a company, just use `firstname-lastname-month`.
4. **Export with password**: `File → Export → Encrypt with Password`. Set the password. Save the file with a recipient-specific name (e.g., `autozone-case-study-jane-acme.pdf`).
5. **First reply: PDF attached, no password.**
   > Hi [Name], attached is the [Case Study] case study, watermarked for you. I'll send the password in a separate note in a moment. Happy to walk through any of it on a call.
6. **Second reply (separate message in same thread): password only.**
   > Password: `jane-acme-may`
7. Note the password somewhere (a Notion page, password manager, or even a spreadsheet) in case they ask later. (~5 min per request.)

---

## What the requester sees automatically

The form already sends them an auto-response so they're not in the dark while you process:

> Hi [Name],
>
> Thanks for requesting my [Case Study] case study. I'll send a password-protected, watermarked PDF within one business day, with the password in a separate message for security.
>
> If you have any questions in the meantime, just reply to this email.
>
> Brittany Welch
> bwelch.me

So even if you take a day to respond manually, they know it's coming and why.

---

## If something feels off about a request

- **Generic / templated message + suspicious email domain**: it's probably a scraper. You can just ignore it.
- **Personal email (gmail / outlook) with no company listed**: low-cost path is to send the PDF anyway since you're watermarking. If it feels weirder than that, reply with a short note asking what role they're hiring for before sending.
- **Explicitly competitive context** (e.g., requester works at a direct competitor to one of your case study clients): you can decline politely. *"Thanks for reaching out. I'm not able to share this particular case study externally given the client context. Happy to talk through my work at a high level on a call if helpful."*

---

## If you want to change the destination email

Search the project for `formsubmit.co/ajax/`. It appears 6 times (once per case study page, plus the index.html modal). Replace the email in all of them. After changing, do the FormSubmit confirmation step again with the new address.

---

## Where the form code lives

- Modal form on the main page: in `index.html`, near the bottom of the `<script>` block.
- Inline forms on case studies: in each `case-studies/*.html` file, near the bottom of the `<script>` block.

All six forms now personalize the email subject and auto-response using the requester's name and the case study they asked for.
