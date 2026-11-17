
import csv
import io
from datetime import date


DATASET_SCHEMAS = {
    "environmental": {
        "required": [
            "date",
            "zone",
            "temperature_c",
            "humidity_pct",
            "aqi"
        ],
        "numeric": [
            "temperature_c",
            "humidity_pct",
            "aqi"
        ]
    },

    "healthcare": {
        "required": [
            "date",
            "zone",
            "visits"
        ],
        "numeric": [
            "visits"
        ]
    },

    "workforce": {
        "required": [
            "date",
            "zone",
            "absence_count",
            "workforce_count"
        ],
        "numeric": [
            "absence_count",
            "workforce_count"
        ]
    }
}


def process_csv(file_content: bytes, dataset_type: str):

    if dataset_type not in DATASET_SCHEMAS:
        raise ValueError(
            "Dataset type must be environmental, healthcare, or workforce."
        )

    if not file_content:
        raise ValueError("The uploaded CSV file is empty.")

    try:
        text_content = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("Please upload a UTF-8 encoded CSV file.")

    reader = csv.DictReader(io.StringIO(text_content))

    if not reader.fieldnames:
        raise ValueError("CSV file must contain column headers.")

    headers = [
        header.strip().lower()
        for header in reader.fieldnames
        if header
    ]

    schema = DATASET_SCHEMAS[dataset_type]

    missing_columns = [
        column for column in schema["required"]
        if column not in headers
    ]

    if missing_columns:
        raise ValueError(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )

    rows = []
    errors = []

    for row_number, original_row in enumerate(reader, start=2):

        if not any(
            str(value or "").strip()
            for value in original_row.values()
        ):
            continue

        row = {
            str(key).strip().lower(): str(value or "").strip()
            for key, value in original_row.items()
            if key is not None
        }

        try:
            date.fromisoformat(row["date"])

            if not row["zone"]:
                raise ValueError("Zone cannot be empty.")

            for column in schema["numeric"]:
                value = float(row[column])

                if not (value == value and abs(value) != float("inf")):
                    raise ValueError(
                        f"{column} must be a finite number."
                    )

                if column != "temperature_c" and value < 0:
                    raise ValueError(
                        f"{column} cannot be negative."
                    )

                row[column] = value

            if dataset_type == "environmental":
                if not 0 <= row["humidity_pct"] <= 100:
                    raise ValueError(
                        "humidity_pct must be between 0 and 100."
                    )

            if dataset_type == "workforce":
                if row["absence_count"] > row["workforce_count"]:
                    raise ValueError(
                        "Absences cannot exceed workforce_count."
                    )

            rows.append(row)

        except (ValueError, KeyError) as error:
            errors.append({
                "row": row_number,
                "reason": str(error)
            })

    if not rows:
        raise ValueError(
            "No valid records found. Check the CSV headers and data."
        )

    zones = sorted(set(row["zone"] for row in rows))

    return {
    "dataset_type": dataset_type,
    "total_rows": len(rows) + len(errors),
    "valid_rows": len(rows),
    "invalid_rows": len(errors),
    "zone_count": len(zones),
    "zones": zones,
    "errors": errors[:20],
    "preview": rows[:5],
    "records": rows
}