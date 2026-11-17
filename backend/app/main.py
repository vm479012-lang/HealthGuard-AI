from app.services.alert_engine import generate_alerts
from fastapi import UploadFile, File, HTTPException
from app.services.data_processor import process_csv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from datetime import datetime, timezone

app = FastAPI(
    title="HealthGuard AI",
    description="Population and Workforce Health Early Warning Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
STORAGE_DIR = Path(__file__).resolve().parents[1] / "storage"
DATA_FILE = STORAGE_DIR / "datasets.json"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def load_stored_datasets():
    if not DATA_FILE.exists():
        return {}

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return {}


def save_dataset(dataset_type, records):
    datasets = load_stored_datasets()

    datasets[dataset_type] = {
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "record_count": len(records),
        "records": records
    }

    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(datasets, file, indent=2)

@app.get("/")
def home():
    return {
        "message": "Welcome to HealthGuard AI",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "HealthGuard AI"
    }


@app.get("/api/dashboard")
def get_dashboard():

    return {
        "data_type": "synthetic_demo",

        "metrics": {
            "monitored_zones": 12,
            "active_alerts": 8,
            "workforce_indicators": 24,
            "environmental_signals": 16
        },

        "trend_data": [
            {"day": "Mon", "health": 42, "environment": 30},
            {"day": "Tue", "health": 48, "environment": 35},
            {"day": "Wed", "health": 44, "environment": 32},
            {"day": "Thu", "health": 58, "environment": 45},
            {"day": "Fri", "health": 53, "environment": 40},
            {"day": "Sat", "health": 68, "environment": 54},
            {"day": "Sun", "health": 62, "environment": 48}
        ],

        "alerts": [
            {
                "level": "High",
                "title": "Elevated heat exposure",
                "location": "Industrial Zone A",
                "detail": "Temperature above the demonstration threshold",
                "time": "12 minutes ago"
            },
            {
                "level": "Medium",
                "title": "Air quality variation",
                "location": "Zone B",
                "detail": "Air quality indicator differs from baseline",
                "time": "38 minutes ago"
            },
            {
                "level": "Low",
                "title": "Workforce absence trend",
                "location": "Zone C",
                "detail": "Slight increase in reported absences",
                "time": "1 hour ago"
            }
        ]
    }

@app.post("/api/upload/{dataset_type}")
async def upload_dataset(
    dataset_type: str,
    file: UploadFile = File(...)
):
    allowed_types = [
        "environmental",
        "healthcare",
        "workforce"
    ]

    if dataset_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset type."
        )

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    content = await file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 5 MB."
        )

    try:
        result = process_csv(content, dataset_type)

        # Store every validated record on the backend
        records = result.pop("records")
        save_dataset(dataset_type, records)

        return {
            "status": "success",
            "message": "CSV processed and stored successfully.",
            "data": result
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    finally:
        await file.close()

@app.get("/api/datasets/status")
def get_dataset_status():
    datasets = load_stored_datasets()

    result = {}

    for dataset_type in [
        "environmental",
        "healthcare",
        "workforce"
    ]:
        dataset = datasets.get(dataset_type)

        if dataset:
            result[dataset_type] = {
                "uploaded": True,
                "record_count": dataset["record_count"],
                "uploaded_at": dataset["uploaded_at"]
            }
        else:
            result[dataset_type] = {
                "uploaded": False,
                "record_count": 0,
                "uploaded_at": None
            }

    return result

@app.get("/api/analytics/combined")
def get_combined_analytics():
    datasets = load_stored_datasets()

    combined = {}

    dataset_types = [
        "environmental",
        "healthcare",
        "workforce"
    ]

    for dataset_type in dataset_types:
        dataset = datasets.get(dataset_type, {})

        for record in dataset.get("records", []):
            key = (record["date"], record["zone"])

            if key not in combined:
                combined[key] = {
                    "date": record["date"],
                    "zone": record["zone"]
                }

            for column, value in record.items():
                if column not in ["date", "zone"]:
                    combined[key][column] = value

    combined_records = []

    for record in combined.values():
        workforce_count = record.get("workforce_count")
        absence_count = record.get("absence_count")

        if workforce_count and absence_count is not None:
            record["absence_rate_pct"] = round(
                absence_count / workforce_count * 100, 2
            )

        combined_records.append(record)

    combined_records.sort(
        key=lambda item: (item["date"], item["zone"])
    )

    return {
        "status": "success",
        "message": "Dataset integration completed.",
        "available_datasets": [
            dataset_type
            for dataset_type in dataset_types
            if dataset_type in datasets
        ],
        "combined_record_count": len(combined_records),
        "records": combined_records
    }

@app.get("/api/alerts")
def get_early_warnings():
    # Reuse the existing combined analytics
    analytics = get_combined_analytics()

    # Get combined observations
    records = analytics["records"]

    # Generate alerts
    alerts = generate_alerts(records)

    return {
        "status": "success",
        "message": "Early warning analysis completed.",
        "total_observations": len(records),
        "total_alerts": len(alerts),
        "alerts": alerts,
        "disclaimer": (
            "Synthetic demonstration data. "
            "Alerts are decision-support signals requiring "
            "human review, not clinical diagnoses."
        )
    }
