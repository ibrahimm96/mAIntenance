from calendar import monthrange
from datetime import date
from .models import MaintenanceRule, ServiceRecord


def add_months(start, months):
    month = start.month - 1 + months
    year = start.year + month // 12
    month = month % 12 + 1
    day = min(start.day, monthrange(year, month)[1])
    return date(year, month, day)


def month_key(value):
    return value.strftime("%Y-%m")


def status_for(due_date, today):
    delta = (due_date - today).days
    if delta < 0:
        return "Overdue"
    if delta <= 45:
        return "Due soon"
    if delta <= 180:
        return "Upcoming"
    return "Later"


def build_forecast(vehicle, today=None):
    today = today or date.today()
    rules = MaintenanceRule.query.order_by(MaintenanceRule.display_name).all()
    services = ServiceRecord.query.filter_by(vehicle_id=vehicle.id).order_by(ServiceRecord.service_date.desc()).all()
    service_items = []

    for rule in rules:
        latest = next((record for record in services if record.service_type == rule.service_type), None)
        if not latest:
            service_items.append(
                {
                    "source": "rule",
                    "service_type": rule.service_type,
                    "display_name": rule.display_name,
                    "status": "Needs history",
                    "message": "Add the last completed service to improve this forecast.",
                    "estimated_min_cost": rule.estimated_min_cost,
                    "estimated_max_cost": rule.estimated_max_cost,
                }
            )
            continue

        due_mileage = latest.service_mileage + rule.mileage_interval if rule.mileage_interval else None
        mileage_due_date = None
        if due_mileage and vehicle.monthly_mileage > 0:
            miles_remaining = max(0, due_mileage - vehicle.current_mileage)
            months_until_due = int(miles_remaining / vehicle.monthly_mileage)
            if miles_remaining % vehicle.monthly_mileage:
                months_until_due += 1
            mileage_due_date = add_months(today, months_until_due)

        time_due_date = add_months(latest.service_date, rule.month_interval) if rule.month_interval else None
        due_candidates = [candidate for candidate in [mileage_due_date, time_due_date] if candidate]
        due_date = min(due_candidates) if due_candidates else None
        item_status = status_for(due_date, today) if due_date else "Needs history"
        service_items.append(
            {
                "source": "rule",
                "service_type": rule.service_type,
                "display_name": rule.display_name,
                "status": item_status,
                "last_completed_date": latest.service_date.isoformat(),
                "last_completed_mileage": latest.service_mileage,
                "due_mileage": due_mileage,
                "due_date": due_date.isoformat() if due_date else None,
                "estimated_min_cost": rule.estimated_min_cost,
                "estimated_max_cost": rule.estimated_max_cost,
                "message": rule.description,
            }
        )

    timeline = []
    for offset in range(12):
        current_month = add_months(today.replace(day=1), offset)
        timeline.append(
            {
                "month": month_key(current_month),
                "label": current_month.strftime("%b %Y"),
                "services": [],
                "min_cost": 0,
                "max_cost": 0,
                "predicted_mileage": vehicle.current_mileage + (vehicle.monthly_mileage * offset),
            }
        )

    for item in service_items:
        due_date_text = item.get("due_date")
        if not due_date_text:
            continue
        due_date = date.fromisoformat(due_date_text)
        bucket = next((month for month in timeline if month["month"] == month_key(due_date)), None)
        if bucket:
            bucket["services"].append(item["display_name"])
            bucket["min_cost"] += item["estimated_min_cost"]
            bucket["max_cost"] += item["estimated_max_cost"]

    most_expensive = max(timeline, key=lambda month: month["max_cost"]) if timeline else None
    due_items = [item for item in service_items if item.get("due_date")]
    next_service = min(due_items, key=lambda item: item["due_date"], default=None)

    return {
        "vehicle": vehicle.to_dict(),
        "items": service_items,
        "timeline": timeline,
        "next_service": next_service,
        "overdue_count": len([item for item in service_items if item.get("status") == "Overdue"]),
        "twelve_month_min": sum(month["min_cost"] for month in timeline),
        "twelve_month_max": sum(month["max_cost"] for month in timeline),
        "most_expensive_month": most_expensive,
    }
