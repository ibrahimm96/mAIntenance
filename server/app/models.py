from datetime import datetime
from . import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    vehicles = db.relationship("Vehicle", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "created_at": self.created_at.isoformat()}


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    nickname = db.Column(db.String(120))
    year = db.Column(db.Integer, nullable=False)
    make = db.Column(db.String(120), nullable=False)
    model = db.Column(db.String(120), nullable=False)
    trim = db.Column(db.String(120))
    engine = db.Column(db.String(120))
    current_mileage = db.Column(db.Integer, nullable=False)
    monthly_mileage = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    services = db.relationship("ServiceRecord", backref="vehicle", cascade="all, delete-orphan")

    def label(self):
        return self.nickname or f"{self.year} {self.make} {self.model}"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "nickname": self.nickname,
            "year": self.year,
            "make": self.make,
            "model": self.model,
            "trim": self.trim,
            "engine": self.engine,
            "current_mileage": self.current_mileage,
            "monthly_mileage": self.monthly_mileage,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class ServiceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicle.id"), nullable=False, index=True)
    service_type = db.Column(db.String(80), nullable=False)
    service_date = db.Column(db.Date, nullable=False)
    service_mileage = db.Column(db.Integer, nullable=False)
    cost = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "service_type": self.service_type,
            "service_date": self.service_date.isoformat(),
            "service_mileage": self.service_mileage,
            "cost": self.cost,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


class MaintenanceRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_type = db.Column(db.String(80), nullable=False, unique=True)
    display_name = db.Column(db.String(120), nullable=False)
    mileage_interval = db.Column(db.Integer)
    month_interval = db.Column(db.Integer)
    estimated_min_cost = db.Column(db.Float, nullable=False)
    estimated_max_cost = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "service_type": self.service_type,
            "display_name": self.display_name,
            "mileage_interval": self.mileage_interval,
            "month_interval": self.month_interval,
            "estimated_min_cost": self.estimated_min_cost,
            "estimated_max_cost": self.estimated_max_cost,
            "description": self.description,
        }
