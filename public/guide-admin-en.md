# Administrator Guide — NLP Lab R&D

> Documentation reserved for administrators and moderators.

---

## Table of Contents

1. [Roles and permissions](#1-roles-and-permissions)
2. [Admin dashboard](#2-admin-dashboard)
3. [Model validation](#3-model-validation)
4. [User management](#4-user-management)
5. [Model import](#5-model-import)
6. [Import file format](#6-import-file-format)
7. [Image management](#7-image-management)
8. [Settings](#8-settings)
9. [Data export](#9-data-export)
10. [Donation management](#10-donation-management)
11. [Homepage announcement](#11-homepage-announcement)
12. [Editorial features](#12-editorial-features)
13. [Visitor statistics](#13-visitor-statistics)
14. [PWA (Progressive Web App)](#14-pwa-progressive-web-app)
15. [Security and API keys](#15-security-and-api-keys)

---

## 1. Roles and permissions

### Visitor (not logged in)

- Browse published and approved models
- Read forum posts
- View events
- Browse resources
- Make a donation

### Logged-in User

Everything a visitor can do, plus:
- Create and edit their own models
- Submit variants and feedback
- Publish, edit and delete their own forum posts
- Like and comment
- Register for events
- Manage their profile
- Receive notifications

### Moderator

Everything a user can do, plus:
- Approve or reject pending models
- Edit and delete any model or post
- Propose models from the forum ("Propose as model")
- Manage Resources articles (create, edit, delete)
- Create and delete events
- Send emails to participants
- Import models via markdown files
- Export data as CSV
- Access the admin dashboard

**Moderators CANNOT**:
- Manage users
- Change application settings
- Toggle Stripe mode (test/live)

### Administrator

Everything a moderator can do, plus:
- **Manage users**: add, delete, change roles
- **Reset passwords** for users
- **Configure settings** for the application
- **Manage donations**: view the donation log, toggle test/live
- **Publish announcements** on the homepage
- **Edit the creation date** of models
- **Permanently delete** models

---

## 2. Admin dashboard

Accessible via the **Admin** link in the navigation.

### Statistics

Six cards:
- Models pending validation (highlighted)
- Validated models
- Total models
- Number of users
- Number of forum posts
- Published models

Status distribution displayed below.

### Tabs

- **Pending models**: view, approve or reject
- **Validated models**: full list with type, author, status
- **Recent activity**: last 8 modified models
- **Users**: table with roles
- **Images**: gallery with replace/delete options
- **Settings**: application configuration

### Quick access buttons

- **Announcement**: publish a message on the homepage
- **Donations**: Stripe payment management
- **Manage users**: dedicated page
- **Import a model**: markdown import
- **Admin guide**: administrator documentation
- **CSV Export**: models, users, posts

---

## 3. Model validation

When a user submits a model, it enters a **pending validation** state.

### From the library

Admins see a **"Pending (N)"** button that displays unvalidated models. Each card has an **"Approve"** button.

### From the model page

- Pending model: orange banner with **Approve** button
- Approved model: green banner with **Return to pending** button

### From the dashboard

"Pending models" tab with View / Reject / Approve actions.

---

## 4. User management

Accessible via **Admin → Manage users** (administrators only).

| Action | Description |
|--------|-------------|
| **Add a user** | Create an account with name, email and initial password |
| **Change role** | Selector: User / Moderator / Administrator |
| **Edit name** | Click the pencil icon, press Enter to save |
| **Edit email** | Click the pencil icon, press Enter to save |
| **Reset password** | Sends a password reset email |
| **Delete** | Deletes the profile and roles (with confirmation) |

Visible information: avatar, name, email, registration date, last login, bio, expertise, UUID.

Note: you cannot change your own role from this page.

---

## 5. Model import

### Access

- **Admin → Import a model**
- Or from the Contribute page → **"Import a file"** button (admin only)

### Workflow

1. Paste the markdown file (or click **Load example**)
2. Click **Preview**
3. Verify: Create/Update badge, metadata, summary and description
4. Click **Create** or **Update**

### Automatic detection

The import searches by title to check if the model already exists and automatically switches between creation and update mode.

### Import as variant

When accessing from the "Create a variant" → "Import a file" button, the `parent_model_id` is automatically linked.

---

## 6. Import file format

### Structure

```markdown
---
action: create | update
title: "Model name"
type: problematique | outil | approche
status: brouillon | en_revision | en_test | publie | en_evolution
version: "1.0.0"
complexity: débutant | intermédiaire | avancé
author: "Author name"
tags:
  - tag1
  - tag2
---

## Summary

Short presentation of the model (1-3 sentences).

## Description

What it is, when to use it.

## Protocole détaillé

Concrete numbered steps.

## Principe actif

Core mechanism that makes it work.

## Points de vigilance

What to watch for, contraindications.

## Prérequis

Required knowledge or conditions.

## Sources

References, authors, publications.
```

### File content

The content of a file consists of two parts:

- **`## Summary`**: short presentation (1-3 sentences), displayed as the model's summary.
- **Description**: all remaining markdown content after the Summary. The headings above (Description, Protocole détaillé, Principe actif, etc.) are **suggestions** — users can add, remove or modify them freely to suit the model's needs.

The description is a single markdown field with no imposed structure. The recommended headings serve as a guide to organize content, but are not mandatory.

### Versioning

| Situation | Rule |
|-----------|------|
| New model | `1.0.0` |
| Minor fixes | `1.0.1` |
| Content additions | `1.1.0` |
| Major overhaul | `2.0.0` |

---

## 7. Image management

Accessible via the **Images** tab in the admin dashboard.

For each image:
- Preview thumbnail
- File name, size and date
- **Replace**: upload a new image to the same location
- **Delete**: remove the image from the server
- **Copy URL**: copy the public address

---

## 8. Settings

| Setting | Description | Default |
|---------|-------------|:------:|
| **Max image size** | Images exceeding this size are rejected | 2 MB |

---

## 9. Data export

Three CSV exports available:
- **Models**: all models with metadata
- **Users**: list of users and roles
- **Posts**: forum publications

---

## 10. Donation management

Accessible via **Admin → Donations**.

### Stripe mode (test / live)

A toggle allows switching between test and live mode:
- **Test mode**: simulated payments, test card `4242 4242 4242 4242`
- **Live mode**: real payments

Switching to live requires confirmation.

### Statistics

- Number of payments
- Total received
- Active monthly subscriptions

### Donation log

Chronological table of all payments received:
- Date, email, amount, type (one-time/monthly)

### Active subscriptions

List of ongoing monthly donations.

### Stripe keys

Keys are stored in **Supabase Secrets** (never in the code):
- `STRIPE_SECRET_KEY_TEST`: test key
- `STRIPE_SECRET_KEY_LIVE`: restricted live key

The active mode is stored in `app_settings` (key `stripe_mode`).

---

## 11. Homepage announcement

Accessible via **Admin → Announcement**.

Allows publishing a message visible to all visitors on the homepage, in a colored banner below the hero section.

### How it works

- Write your message in **Markdown** (bold, links, lists supported)
- Click **Publish announcement** to display it
- Click **Delete announcement** to hide the banner
- A **Preview** button shows the rendering before publishing
- If the content is empty, the banner does not appear

The banner automatically adapts to the theme chosen by the user (different colors per theme).

---

## 12. Editorial features

### Propose as model (from the forum)

Admins/moderators see a **"Propose as model"** button under each forum post. This creates a pre-filled model with the discussion content and a link in the `post_model_links` table.

### Multi-author evolution log

In edit mode, the "Evolution log" section allows you to:
- Describe what changed
- Credit multiple contributors via a selector
- The entry is automatically added with version and date

### Associated approach

Tools and experiences can be linked to an approach via a selector visible in edit mode and in the contribution form. On an approach's page, a block automatically displays all linked models.

### Model translations

Administrators can create translations of models:

1. Open an existing model's page
2. Below the tags, click **"Create English version"** (or "Create French version")
3. A new model is created in the other language, linked to the original via `translation_of`
4. The title is copied, but the description and sections are left empty
5. Two options for writing the translation:
   - **Edit**: write directly in the editor
   - **Import a sheet**: paste translated markdown via the import page

Once the translation is written, both pages display a link to switch between versions (**"View in English"** / **"Voir en français"**).

#### Import with language selection

The import page (**Admin → Import a model**) has a **FR | EN** toggle that sets the language of the imported model. The language badge is visible in the preview.

### Creation date (admin)

Administrators can edit a model's **creation date** via the date field in edit mode. Useful for backdating models that existed before the platform.

### Profile editing (admin)

Administrators can edit any user's profile:
1. Go to the **Contributors** page or a user's public profile
2. Click **"Edit profile"** in the top right
3. Edit the CV, personal links, bio, expertise
4. Click **Save**

The URL is `/profile?user=<userId>` — the `user` parameter allows an admin to edit a profile other than their own.

### Anti-bot protection at registration

Four mechanisms protect the registration form:

| Protection | How it works |
|------------|-------------|
| **Honeypot** | Invisible field filled only by bots — registration silently blocked |
| **NLP question** | "The map is not the ..." — only an NLP practitioner knows the answer |
| **Name validation** | Rejects suspicious names (numbers only, URLs, special characters) |
| **Email confirmation** | The account is only active after clicking the confirmation link in the email (setting "Confirm email" in Supabase → Authentication → Providers → Email) |
| **Restricted access** | Only the homepage, login page and donation page are accessible without an account. All other pages redirect to login |

### Author vs Uploader

The `author_name` field identifies the model's author (free text), distinct from the uploader (the person who loaded the model, identified by `user_id`). Both are displayed on the model page.

### Preview popup

In edit mode, a **Preview** button opens a modal showing how the model will look with rendered markdown. This allows checking the formatting before saving.

### Version management

When saving with a changed version number, the previous version is archived as a snapshot. An optional **"Version notes"** field describes what changed. Archived versions are viewable in a **Versions** tab. Admins can delete archived versions.

### Resources article management

Admins/moderators can create, edit and delete markdown articles in the Resources section. Image upload is supported within the content.

---

## 13. Visitor statistics

The site uses **Umami** (cloud.umami.is) for visitor statistics. Umami is an open-source tool, cookie-free and GDPR-compliant — no consent banner is required.

### Access

Log in at **cloud.umami.is** with the configured account. The dashboard displays:
- Page views and unique visitors
- Traffic sources (referrers)
- Visitor countries and languages
- Devices and browsers
- Most viewed pages

### How it works

A lightweight script (~2 KB) is loaded on every page. It sends navigation data to Umami Cloud without storing cookies or personal data on the visitor's browser.

The free plan allows 10,000 events per month — more than enough for current traffic.

---

## 14. PWA (Progressive Web App)

The site is installable as a mobile application. The PWA files are:

- **`manifest.json`**: name, icon, colors, display mode (standalone)
- **`sw.js`**: service worker with network-first strategy
  - Requests to Supabase, Stripe and Umami are never intercepted
  - Visited pages are cached for offline access
  - The cache is automatically cleaned during updates

The service worker does not modify the application's online behavior. It only serves as a fallback when the network is unavailable.

To force a cache update after a deployment, increment `CACHE_NAME` in `sw.js`.

---

## 15. Security and API keys

### Client-side keys (public)

Stored in `.env` (not committed to git):
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key (designed to be public, protected by RLS)

A `.env.example` file documents the required variables without the values.

### Server-side keys (secret)

Stored in **Supabase Secrets** (inaccessible from the client):
- `STRIPE_SECRET_KEY_TEST`: Stripe test key
- `STRIPE_SECRET_KEY_LIVE`: restricted Stripe live key (permissions: Checkout Sessions Write, Products/Prices Read)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service key (auto-configured)

### Edge Functions

Supabase Edge Functions run server-side:
- `create-donation`: creates a Stripe Checkout session (no JWT verification — accessible to all)
- `list-donations`: lists Stripe payments (verifies the user is an admin in the code)
- `send-event-email`: sends emails to participants
- `send-model-notification`: change notifications

### Best practices

- The `.env` is in `.gitignore` — never commit it
- Secret Stripe keys never pass through the browser
- The live Stripe key is restricted (minimal permissions)
- Test/live mode is controllable from the admin interface

---

*NLP Lab R&D — Administrator Guide*
