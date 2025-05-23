# Lead Sync CLI

This project synchronizes lead data between **Zendesk** and **Instantly** through a series of CLI scripts.

---

## Prerequisites
Before running the CLI, make sure you have the following:
Node.js installed.
.env file containing necessary configurations.
Example .env:
```
API_URL_ZENDESK='https://api.getbase.com/v2/'
API_TOKEN_ZENDESK=
API_URL_INSTANTLY='https://api.instantly.ai/api/v2/'
API_TOKEN_INSTANTLY=

CAMPAIGN_EDU_JOB=
CAMPAIGN_EVENT=
CAMPAIGN_EDU_ADVERTS=
CAMPAIGN_EDU_DEALS=
CAMPAIGN_COLD_EDUCATOR=
CAMPAIGN_VENDOR_ADVERT=
CAMPAIGN_EDU_BUSINESS=
```
---

## Installation
Clone this repository and install the dependencies:
```
git clone <repository_url>
cd <project_directory>
npm install

```
Setup your MySQL database

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

---
## 🔧 How to Run with Docker

Run these commands:

```
docker compose build
docker compose run --rm app npx knex migrate:latest
docker compose run --rm app node download-leads.js 
docker compose run --rm app node upload-leads.js 
docker compose run --rm app node download-leads-activity.js <CAMPAIGN_ID>
docker compose run --rm app node upload-leads-activity.js <CAMPAIGN_ID>
```

---

## 🔧 How to Run without Docker

### Step 1: Download leads from Zendesk
This command downloads leads from Zendesk and categorizes them into different files. 

Usage:
```
node download-leads.js
```

### Step 2: Upload leads to Instantly
This command uploads the categorized leads to Instantly.

Usage:
```
node upload-leads.js
```

### Step 3: Download lead activity from Instantly (replace {{CAMPAIGN_ID}} accordingly)
This command downloads the activity for leads in a given campaign. You must provide the campaignId for the specific campaign.

Usage:
```
node download-leads-activity.js <CAMPAIGN_ID>
```

### Step 4: Upload lead activity to Zendesk (replace {{CAMPAIGN_ID}} accordingly)
This command uploads the activity of leads in a given campaign back to Zendesk. It requires the campaignId for the specific campaign.

Usage:
```
node upload-leads-activity.js <CAMPAIGN_ID>
```
---

## 📤 Uploading Leads (Zendesk ➡️ Instantly)
To upload leads into Instantly, follow this 2-step process:
### 1. Download Leads from Zendesk
- Reads all leads from Zendesk.
- Categorizes leads based on defined criteria.
- Saves leads in db table leads, categorized into the following seven groups:
    - edu_business
    - educator
    - invested_ad
    - offered_deal
    - posted_event
    - posted_job
    - vendor
### 2. Upload Leads to Instantly
- Reads the categorized lead from database.
- Each lead is mapped to a corresponding campaign in Instantly:
| Category     | Instantly Campaign       |
| ------------ | ------------------------ |
| edu_business | `CAMPAIGN_EDU_BUSINESS`  |
| educator     | `CAMPAIGN_COLD_EDUCATOR` |
| invested_ad  | `CAMPAIGN_EDU_ADVERTS`   |
| offered_deal | `CAMPAIGN_EDU_DEALS`     |
| posted_event | `CAMPAIGN_EVENT`         |
| posted_job   | `CAMPAIGN_EDU_JOB`       |
| vendor       | `CAMPAIGN_VENDOR_ADVERT` |

---
## 📥 Uploading Leads' Activity (Instantly ➡️ Zendesk)
To update Zendesk with lead activity from Instantly, follow these two steps:

### 1. Download Lead Activity from Instantly
- Fetch campaign details based on the provided CAMPAIGN_ID.
- Retrieve leads and their activity for the campaign.
- Store results in db table leads_activity.
### 2. Upload Lead Activity to Zendesk
- Read data from db table leads_activity.
- For each lead:
    - Fetch the lead’s detail from Zendesk.
    - Determine the lead owner’s email.
    - Add corresponding notes and tasks to the lead in Zendesk.

---
## 📁 Directory Structure
```
project-root/
├── logs/
│   └── {{YYYY-MM-DD}}_download-leads.log
│   └── {{YYYY-MM-DD}}_upload-leads.log
├── services/samples
├── services/
│   ├── helpers.js
│   ├── http.js
│   ├── instantly.js
│   └── zendesk.js
├── download-leads.js
├── upload-leads.js
├── download-leads-activity.js
└── upload-leads-activity.js
└── package.json
```
---
## Logging
The application logs important events to the console, so you can monitor the progress, success, and failure of each step. Errors will be reported with details to help in debugging.
Logs are stored in directory ./logs