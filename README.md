# BigQuery Release Notes Dashboard

A modern, responsive dark-themed web dashboard built using **Python Flask** and **Vanilla HTML, CSS, and JS** that fetches, parses, filters, and shares Google Cloud BigQuery release notes.

---

## 🚀 Key Features

* **Real-time Sync**: Pulls live release data from the official [BigQuery Release Notes Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml).
* **Segmented Parsing**: Automatically splits multi-topic daily announcements into single update cards categorized by type (Features, Issues, Changes, Announcements).
* **Metrics Dashboard**: Displays a breakdown of statistics for release types.
* **Instant Filtering & Search**: Client-side full-text search and category filtering with instant UI rendering.
* **Select & Tweet Sharing**: Click cards to select them and share them via automated, character-limit-safe Twitter Web Intents.

---

## 🛠️ Tech Stack

* **Backend**: Python 3, Flask
* **Frontend**: Vanilla HTML5, CSS3 (Custom properties, grid, flexbox, glassmorphic styles), ES6 JavaScript

---

## 📂 Project Structure

```text
├── app.py                # Flask application backend (XML scraper & API)
├── architecture_overview.md # Detailed sequence flow & system explanation
├── templates/
│   └── index.html        # Single Page Application HTML structure
├── static/
│   ├── css/
│   │   └── style.css     # Premium dark theme styling
│   └── js/
│       └── app.js        # UI rendering, search/filters, and Twitter sharing
├── .gitignore            # Git exclusion rules
└── README.md             # This document
```

---

## 💻 Local Setup & Development

Follow these steps to run the application locally on macOS or Linux:

### 1. Initialize Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install flask
```

### 3. Run the Server
```bash
python app.py
```
Open **[http://127.0.0.1:5005](http://127.0.0.1:5005)** in your web browser.

---

## ☁️ Deployment (Cloud Run)

To deploy the application to Google Cloud Run:

```bash
# Deploy directly from the source directory
gcloud run deploy bigquery-release-notes \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```
