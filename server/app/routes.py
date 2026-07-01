from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from . import bcrypt, db
from .forecast import build_forecast
from .models import ServiceRecord, User, Vehicle
from .seed import seed_demo_data
from .validation import SERVICE_TYPES, parse_date, parse_float, parse_int, require_text

api_bp = Blueprint("api", __name__)


def error(message, status=400):
    return jsonify({"error": message}), status


def current_user():
    return User.query.get(int(get_jwt_identity()))


def owned_vehicle(vehicle_id):
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return None, error("Vehicle not found", 404)
    if vehicle.user_id != int(get_jwt_identity()):
        return None, error("Unauthorized access", 403)
    return vehicle, None


def service_owner(service_id):
    record = ServiceRecord.query.get(service_id)
    if not record:
        return None, error("Service record not found", 404)
    if record.vehicle.user_id != int(get_jwt_identity()):
        return None, error("Unauthorized access", 403)
    return record, None


@api_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@api_bp.post("/seed/demo")
def seed_demo():
    seed_demo_data()
    return jsonify({"message": "Demo data seeded"})


@api_bp.post("/auth/register")
def register():
    data = request.get_json() or {}
    try:
        name = require_text(data, "name")
        email = require_text(data, "email").lower()
        password = require_text(data, "password")
    except ValueError as exc:
        return error(str(exc))
    if len(password) < 8:
        return error("password must be at least 8 characters")
    if User.query.filter_by(email=email).first():
        return error("An account with this email already exists", 409)
    user = User(name=name, email=email, password_hash=bcrypt.generate_password_hash(password).decode("utf-8"))
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "access_token": token}), 201


@api_bp.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return error("Invalid login", 401)
    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "access_token": token})


@api_bp.get("/auth/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return error("Unauthorized access", 401)
    return jsonify({"user": user.to_dict()})


def vehicle_payload(data, vehicle=None):
    year = parse_int(data.get("year"), "year", minimum=1886)
    current_mileage = parse_int(data.get("current_mileage"), "current_mileage")
    monthly_mileage = parse_int(data.get("monthly_mileage"), "monthly_mileage", minimum=1)
    return {
        "nickname": (data.get("nickname") or "").strip() or None,
        "year": year,
        "make": require_text(data, "make"),
        "model": require_text(data, "model"),
        "trim": (data.get("trim") or "").strip() or None,
        "engine": (data.get("engine") or "").strip() or None,
        "current_mileage": current_mileage,
        "monthly_mileage": monthly_mileage,
    }


@api_bp.get("/vehicles")
@jwt_required()
def list_vehicles():
    vehicles = Vehicle.query.filter_by(user_id=int(get_jwt_identity())).order_by(Vehicle.created_at.desc()).all()
    return jsonify({"vehicles": [vehicle.to_dict() for vehicle in vehicles]})


@api_bp.post("/vehicles")
@jwt_required()
def create_vehicle():
    data = request.get_json() or {}
    try:
        payload = vehicle_payload(data)
    except ValueError as exc:
        return error(str(exc))
    vehicle = Vehicle(user_id=int(get_jwt_identity()), **payload)
    db.session.add(vehicle)
    db.session.commit()
    return jsonify({"vehicle": vehicle.to_dict()}), 201


@api_bp.get("/vehicles/<int:vehicle_id>")
@jwt_required()
def get_vehicle(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    return jsonify({"vehicle": vehicle.to_dict()})


@api_bp.put("/vehicles/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    data = request.get_json() or {}
    try:
        payload = vehicle_payload(data, vehicle)
    except ValueError as exc:
        return error(str(exc))
    for key, value in payload.items():
        setattr(vehicle, key, value)
    db.session.commit()
    return jsonify({"vehicle": vehicle.to_dict()})


@api_bp.delete("/vehicles/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({"message": "Vehicle deleted"})


def service_payload(data):
    service_type = require_text(data, "service_type")
    if service_type not in SERVICE_TYPES:
        return error("Unsupported service type")
    return {
        "service_type": service_type,
        "service_date": parse_date(data.get("service_date"), "service_date"),
        "service_mileage": parse_int(data.get("service_mileage"), "service_mileage"),
        "cost": parse_float(data.get("cost"), "cost", required=False),
        "notes": (data.get("notes") or "").strip() or None,
    }


@api_bp.get("/vehicles/<int:vehicle_id>/services")
@jwt_required()
def list_services(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    services = ServiceRecord.query.filter_by(vehicle_id=vehicle.id).order_by(ServiceRecord.service_date.desc()).all()
    return jsonify({"services": [record.to_dict() for record in services], "service_types": sorted(SERVICE_TYPES)})


@api_bp.post("/vehicles/<int:vehicle_id>/services")
@jwt_required()
def create_service(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    try:
        payload = service_payload(request.get_json() or {})
        if not isinstance(payload, dict):
            return payload
    except ValueError as exc:
        return error(str(exc))
    record = ServiceRecord(vehicle_id=vehicle.id, **payload)
    db.session.add(record)
    db.session.commit()
    return jsonify({"service": record.to_dict()}), 201


@api_bp.put("/services/<int:service_id>")
@jwt_required()
def update_service(service_id):
    record, failure = service_owner(service_id)
    if failure:
        return failure
    try:
        payload = service_payload(request.get_json() or {})
        if not isinstance(payload, dict):
            return payload
    except ValueError as exc:
        return error(str(exc))
    for key, value in payload.items():
        setattr(record, key, value)
    db.session.commit()
    return jsonify({"service": record.to_dict()})


@api_bp.delete("/services/<int:service_id>")
@jwt_required()
def delete_service(service_id):
    record, failure = service_owner(service_id)
    if failure:
        return failure
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Service record deleted"})


@api_bp.get("/vehicles/<int:vehicle_id>/forecast")
@jwt_required()
def forecast(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    return jsonify(build_forecast(vehicle))
