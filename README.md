# ReviewGuard AI — Fake Product Review Detection System

ReviewGuard AI is a modern, responsive full-stack web application for automated detection of fake or incentivized customer reviews using a pre-trained Natural Language Processing (NLP) machine learning pipeline (`TfidfVectorizer` + `LogisticRegression`).

---

## 🚀 Key Features

- **Trained Model Inference**: Utilizes the pre-trained Scikit-Learn TF-IDF pipeline and metadata threshold extracted directly from `reviewguard_artifacts (1).zip`.
- **FastAPI Backend**:
  - `GET /api/health` — Returns status, model health, and trained metrics.
  - `POST /api/predict` — Computes probability distributions, labels (`FAKE` vs `GENUINE`), and confidence levels with input validation.
  - CORS-enabled for smooth local development.
- **Modern React + Vite Frontend**:
  - Polished, responsive, clean white-themed UI styled with Tailwind CSS.
  - Session statistics dashboard (Analyzed, Genuine detected, Fake flagged).
  - Review Title, Review Text, Optional Product Name, and Star Rating selector.
  - Interactive test samples for instant one-click testing.
  - Animated progress bars for Genuine vs. Fake probability.
  - Session history table stored strictly in browser memory (no database required).
  - Clear consumer disclaimers and empty/loading states.

---

## 📁 Project Structure

```text
RG/
├── backend/
│   ├── model/
│   │   ├── pipeline.joblib     # Extracted trained model pipeline
│   │   └── metadata.json       # Trained threshold & evaluation metrics
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Backend dependencies
│   └── test_integration.py    # Automated test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main dashboard UI
│   │   ├── sampleReviews.js    # Pre-configured test sample reviews
│   │   ├── index.css           # Tailwind base styles
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js          # Configured with /api proxy to FastAPI
├── reviewguard_artifacts (1).zip
└── README.md
```

---

## 🛠️ Step-by-Step Launch Instructions (Windows)

You will run the backend and frontend in **two separate terminal windows**.

### 1️⃣ Terminal 1: Start the FastAPI Backend

Open PowerShell or Command Prompt, navigate to the project directory, and run:

```powershell
# 1. Navigate to the project root
cd C:\Users\kirit\OneDrive\Desktop\RG

# 2. (Optional) Install Python dependencies if not already installed
pip install -r backend/requirements.txt

# 3. Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend will be active at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### 2️⃣ Terminal 2: Start the React Frontend

Open a second terminal window and run:

```powershell
# 1. Navigate to the frontend directory
cd C:\Users\kirit\OneDrive\Desktop\RG\frontend

# 2. Launch the Vite development server
npm run dev
```

* Frontend will be live at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

To test model loading, threshold logic, and endpoints without launching the browser, run:

```powershell
cd C:\Users\kirit\OneDrive\Desktop\RG
python -m unittest backend.test_integration
```
