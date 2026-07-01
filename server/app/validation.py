from datetime import date

SERVICE_TYPES = {
    "Oil change",
    "Tire rotation",
    "Tire replacement",
    "Brake service",
    "Brake fluid",
    "Battery",
    "Spark plugs",
    "Coolant",
    "Transmission fluid",
    "Air filter",
    "Registration",
    "Custom service",
}


def parse_int(value, field, required=True, minimum=0):
    if value in (None, ""):
        if required:
            raise ValueError(f"{field} is required")
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a number")
    if parsed < minimum:
        raise ValueError(f"{field} is invalid")
    return parsed


def parse_float(value, field, required=True, minimum=0):
    if value in (None, ""):
        if required:
            raise ValueError(f"{field} is required")
        return 0
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a number")
    if parsed < minimum:
        raise ValueError(f"{field} is invalid")
    return parsed


def parse_date(value, field):
    if not value:
        raise ValueError(f"{field} is required")
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{field} is invalid")


def require_text(data, field):
    value = (data.get(field) or "").strip()
    if not value:
        raise ValueError(f"{field} is required")
    return value
