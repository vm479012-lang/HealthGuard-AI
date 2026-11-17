
# HealthGuard AI - Early Warning Engine
# Rule-based demonstration version

WARNING_THRESHOLDS = {
    "temperature_c": 38,
    "aqi": 120,
    "absence_rate_pct": 8
}


def generate_alerts(records: list[dict]) -> list[dict]:
    alerts = []

    for record in records:
        signals = []

        temperature = record.get("temperature_c")
        aqi = record.get("aqi")
        absence_rate = record.get("absence_rate_pct")

        # Environmental warning: temperature
        if temperature is not None and temperature >= WARNING_THRESHOLDS["temperature_c"]:
            signals.append(
                f"Elevated temperature: {temperature}°C"
            )

        # Environmental warning: air quality
        if aqi is not None and aqi >= WARNING_THRESHOLDS["aqi"]:
            signals.append(
                f"Elevated AQI: {aqi}"
            )

        # Workforce warning: absence rate
        if absence_rate is not None and absence_rate >= WARNING_THRESHOLDS["absence_rate_pct"]:
            signals.append(
                f"Elevated workforce absence rate: {absence_rate}%"
            )

        # No warning signals for this observation
        if not signals:
            continue

        # Assign illustrative priority
        if len(signals) >= 3:
            priority = "High"
        elif len(signals) == 2:
            priority = "Medium"
        else:
            priority = "Low"

        alerts.append({
            "date": record.get("date"),
            "zone": record.get("zone"),
            "level": priority,
            "title": f"{priority} priority health signal",
            "detail": "; ".join(signals),
            "signals": signals,
            "signal_count": len(signals),
            "status": "Requires human review",
            "data_type": "Synthetic demonstration data"
        })

    return alerts
