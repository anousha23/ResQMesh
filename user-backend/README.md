# ResQMesh — User Backend API Server

Offline-first Express & SQLite Backend for the **ResQMesh User App**, integrated with **Sarvam AI Multilingual Interface Localization** and bridged to the **Rescuer Host Backend System**.

---

## 🚀 Key Features

1. **User Onboarding & Profile Management**:
   - **Step 1 (Personal Info)**: Full name, age, blood group, profile photo avatar upload.
   - **Step 2 (Medical Details)**: Allergies, existing medical conditions, current medications.
   - **Step 3 (Emergency Contact & Language)**: Contact name, relationship, phone number, preferred language.
2. **Sarvam AI Multilingual Interface Localization**:
   - Live Translation API from regional Indian languages (Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada) into English.
   - Complete App UI String Bundle delivery (`GET /api/v1/sarvam/dictionary?lang=hi-IN`).
   - SQLite pre-cached phrase fallback (`sarvam_cache`) for 100% offline disaster resilience.
3. **Log Out & Start Again**:
   - Endpoint `POST /api/v1/user/reset` clears user session, profile, and stored avatars, resetting the setup wizard.
4. **Citizen SOS & Rescuer Host Bridge**:
   - Endpoint `POST /api/v1/sos` creates SOS record, translates regional emergency descriptions, attaches user medical snapshot, and forwards canonical payload (`source_type: "CIVILIAN"`, `modality: "SOS"`) directly to the Rescuer Host backend `POST /events`.
   - SOS status lifecycle tracking (`CREATED` ➔ `TRANSMITTING` ➔ `SENT` ➔ `RECEIVED` ➔ `HELP_DISPATCHED` ➔ `RESOLVED`).

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env`:

```env
PORT=5000
NODE_ENV=development
SARVAM_API_KEY=your_actual_sarvam_api_key_here
SARVAM_API_URL=https://api.sarvam.ai/translate
RESCUER_HOST_URL=http://localhost:8000/events
DB_FILE=resqmesh_user.db
```

---

## 📡 API Endpoints Overview

### 1. User & Onboarding (`/api/v1/user`)
- `POST /api/v1/user/onboarding/step1` — Form-data with `full_name`, `age`, `blood_group`, optional file `profile_photo`.
- `POST /api/v1/user/onboarding/step2` — JSON with `user_id`, `allergies`, `medical_conditions`, `medications`.
- `POST /api/v1/user/onboarding/step3` — JSON with `user_id`, `contact_name`, `relationship`, `phone_number`, `preferred_language`.
- `GET /api/v1/user/profile?user_id=...` — Returns full profile and UI dictionary.
- `PUT /api/v1/user/language` — JSON with `user_id`, `preferred_language`. Updates language preference.
- `POST /api/v1/user/reset` — JSON with `user_id`. Clears profile session.

### 2. Sarvam AI Multilingual Localization (`/api/v1/sarvam`)
- `GET /api/v1/sarvam/dictionary?lang=hi-IN` — Fetch UI string dictionary for selected language.
- `POST /api/v1/sarvam/translate` — Live translate text from regional language to English.

### 3. Citizen SOS System (`/api/v1/sos`)
- `POST /api/v1/sos` — Body: `{ user_id, emergency_type, description, latitude, longitude }`.
- `GET /api/v1/sos/status?sos_id=...` — Returns SOS status lifecycle.
- `POST /api/v1/sos/:id/cancel` — Resolves/cancels active SOS.

---

## 🧪 Running Server & Tests

Start server:
```bash
npm start
```

Run test suite:
```bash
npm test
```
