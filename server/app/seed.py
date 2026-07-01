from datetime import date
from . import bcrypt, db
from .models import MaintenanceRule, ServiceRecord, User, Vehicle

RULES = [
    ("Oil change", 7500, 12, 70, 130),
    ("Tire rotation", 7500, 12, 25, 60),
    ("Air filter", 20000, 24, 30, 90),
    ("Brake fluid", None, 24, 100, 200),
    ("Battery", None, 48, 150, 350),
    ("Coolant", 50000, 48, 120, 300),
    ("Spark plugs", 60000, None, 150, 500),
    ("Transmission fluid", 70000, 60, 300, 900),
    ("Tire replacement", 45000, 60, 500, 1200),
    ("Brake service", 40000, 36, 350, 900),
]


def seed_rules():
    for service_type, miles, months, min_cost, max_cost in RULES:
        if MaintenanceRule.query.filter_by(service_type=service_type).first():
            continue
        db.session.add(
            MaintenanceRule(
                service_type=service_type,
                display_name=service_type,
                mileage_interval=miles,
                month_interval=months,
                estimated_min_cost=min_cost,
                estimated_max_cost=max_cost,
                description=f"Default interval for {service_type.lower()}.",
            )
        )
    db.session.commit()


def seed_demo_data():
    seed_rules()
    email = "demo@maintenance.local"
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(name="Demo Driver", email=email, password_hash=bcrypt.generate_password_hash("password123").decode("utf-8"))
        db.session.add(user)
        db.session.flush()

    vehicle = Vehicle.query.filter_by(user_id=user.id, make="BMW", model="328i", year=2014).first()
    if not vehicle:
        vehicle = Vehicle(
            user_id=user.id,
            nickname="BMW 328i",
            year=2014,
            make="BMW",
            model="328i",
            current_mileage=82000,
            monthly_mileage=900,
        )
        db.session.add(vehicle)
        db.session.flush()
        db.session.add_all(
            [
                ServiceRecord(vehicle_id=vehicle.id, service_type="Oil change", service_date=date(2026, 3, 15), service_mileage=78000, cost=95),
                ServiceRecord(vehicle_id=vehicle.id, service_type="Brake fluid", service_date=date(2024, 10, 10), service_mileage=62000, cost=160),
                ServiceRecord(vehicle_id=vehicle.id, service_type="Battery", service_date=date(2023, 5, 20), service_mileage=49000, cost=240),
            ]
        )
    db.session.commit()
