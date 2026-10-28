import os
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

import joblib
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("reviewguard-backend")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
PIPELINE_PATH = os.path.join(MODEL_DIR, "pipeline.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "metadata.json")

# Global state for loaded pipeline and metadata
model_state: Dict[str, Any] = {
    "pipeline": None,
    "metadata": None,
    "optimal_threshold": 0.5,
    "classes": [0, 1]
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and metadata once at startup."""
    logger.info("Initializing ReviewGuard AI model artifact...")
    if not os.path.exists(PIPELINE_PATH):
        logger.error(f"Pipeline artifact not found at {PIPELINE_PATH}")
        raise FileNotFoundError(f"Pipeline not found at {PIPELINE_PATH}")
    
    try:
        pipeline = joblib.load(PIPELINE_PATH)
        model_state["pipeline"] = pipeline
        classes = getattr(pipeline, "classes_", [0, 1])
        model_state["classes"] = [int(c) for c in classes]
        logger.info(f"Loaded pipeline successfully. Classes: {model_state['classes']}")
    except Exception as e:
        logger.exception(f"Failed to load joblib pipeline: {e}")
        raise RuntimeError(f"Failed to load model pipeline: {e}")

    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                model_state["metadata"] = metadata
                model_state["optimal_threshold"] = float(metadata.get("optimal_threshold", 0.7524242424242424))
                logger.info(f"Loaded metadata. Optimal threshold: {model_state['optimal_threshold']}")
        except Exception as e:
            logger.warning(f"Could not parse metadata.json: {e}")
            model_state["metadata"] = {}

    yield
    logger.info("Shutting down ReviewGuard AI backend...")


app = FastAPI(
    title="ReviewGuard AI API",
    description="Backend API for Fake Product Review Detection using Scikit-Learn TF-IDF + Logistic Regression",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    review_text: str = Field(
        ...,
        min_length=3,
        description="Main text of the customer review to analyze",
        examples=["I purchased this wireless mouse last month. The ergonomics are comfortable and battery lasts long."]
    )
    review_title: Optional[str] = Field(
        default=None,
        description="Optional title/summary of the review",
        examples=["Great ergonomic mouse for work"]
    )
    product_name: Optional[str] = Field(
        default=None,
        description="Optional name of the product",
        examples=["ErgoPro Wireless Mouse"]
    )
    star_rating: Optional[float] = Field(
        default=None,
        ge=1.0,
        le=5.0,
        description="Optional product star rating (1 to 5)"
    )


class PredictResponse(BaseModel):
    prediction: str  # "FAKE" or "GENUINE"
    label: int       # 1 for Fake, 0 for Genuine
    fake_probability: float
    genuine_probability: float
    confidence: float
    threshold_used: float
    analysis_details: Dict[str, Any]
    model_name: str
    is_fallback: bool = False


@app.get("/api/health")
async def health_check():
    """Health check endpoint confirming service status and model readiness."""
    is_ready = model_state["pipeline"] is not None
    return {
        "status": "healthy" if is_ready else "degraded",
        "model_loaded": is_ready,
        "model_name": model_state["metadata"].get("best_config_name", "Word_TFIDF_LogisticRegression") if model_state["metadata"] else "Word_TFIDF_LogisticRegression",
        "optimal_threshold": model_state["optimal_threshold"],
        "metrics": model_state["metadata"].get("metrics", {}) if model_state["metadata"] else {},
        "version": "1.0.0"
    }


@app.post("/api/predict", response_model=PredictResponse)
async def predict_review(payload: PredictRequest):
    """
    Analyzes review content using the trained TF-IDF + LogisticRegression pipeline.
    
    GROUND TRUTH CLASS MAPPING:
      - Class 1: FAKE / DECEPTIVE review (positive target class)
      - Class 0: GENUINE / HONEST review (negative class)
      - Decision Threshold: optimal_threshold (default 0.7524 from metadata.json)
      - Decision rule: If P(Class 1 / Fake) >= optimal_threshold -> FAKE, else GENUINE.
    """
    pipeline = model_state.get("pipeline")
    if pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model pipeline is not loaded yet or failed initialization."
        )

    # Clean and validate input
    review_text = payload.review_text.strip()
    if len(review_text) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review text is too short. Please provide at least 3 characters."
        )

    # The pipeline is a Word_TFIDF_LogisticRegression pipeline expecting review text
    full_text = f"{payload.review_title.strip()} {review_text}" if payload.review_title and payload.review_title.strip() else review_text

    try:
        # Predict class probabilities: pipeline.classes_ = [0, 1]
        probs = pipeline.predict_proba([full_text])[0]
        prob_genuine = float(probs[0])   # Class 0: Genuine
        prob_fake = float(probs[1])      # Class 1: Fake

        threshold = model_state["optimal_threshold"]

        # Classification decision based on metadata threshold applied to Fake (Class 1):
        is_fake = prob_fake >= threshold
        prediction_label = "FAKE" if is_fake else "GENUINE"
        label_int = 1 if is_fake else 0

        # Confidence percentage (distance from threshold scaled to 50% - 100%)
        if is_fake:
            range_span = max(1.0 - threshold, 0.001)
            confidence = round(min(100.0, max(50.0, 50.0 + ((prob_fake - threshold) / range_span) * 50.0)), 1)
        else:
            range_span = max(threshold, 0.001)
            confidence = round(min(100.0, max(50.0, 50.0 + ((threshold - prob_fake) / range_span) * 50.0)), 1)

        model_name = "Word_TFIDF_LogisticRegression"
        if model_state["metadata"] and "best_config_name" in model_state["metadata"]:
            model_name = model_state["metadata"]["best_config_name"]

        words = review_text.split()
        word_count = len(words)
        char_count = len(review_text)

        return PredictResponse(
            prediction=prediction_label,
            label=label_int,
            fake_probability=round(prob_fake, 4),
            genuine_probability=round(prob_genuine, 4),
            confidence=confidence,
            threshold_used=round(threshold, 4),
            analysis_details={
                "word_count": word_count,
                "character_count": char_count,
                "has_title": bool(payload.review_title and payload.review_title.strip()),
                "star_rating": payload.star_rating,
                "product_name": payload.product_name,
                "raw_probabilities": {
                    "class_0_genuine": round(prob_genuine, 4),
                    "class_1_fake": round(prob_fake, 4)
                }
            },
            model_name=model_name,
            is_fallback=False
        )

    except Exception as e:
        logger.exception(f"Inference error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference computation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
