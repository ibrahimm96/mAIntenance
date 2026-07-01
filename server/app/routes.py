import json
import os
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from openai import OpenAI
from . import bcrypt, db
from .forecast import build_forecast
from .models import AIRecommendationItem, AIRecommendationSet, ServiceRecord, User, Vehicle
from .seed import seed_demo_data
from .validation import SERVICE_TYPES, parse_date, parse_float, parse_int, require_text

api_bp = Blueprint("api", __name__)

AI_DISCLAIMER = "AI recommendations are educational and may be inaccurate. They are not a confirmed diagnosis."


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


@api_bp.get("/vehicles/<int:vehicle_id>/recommendations")
@jwt_required()
def get_recommendations(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    recommendation_set = AIRecommendationSet.query.filter_by(vehicle_id=vehicle.id).first()
    return jsonify({"recommendations": recommendation_set.to_dict() if recommendation_set else None})


def fallback_recommendations(vehicle):
    return {
        "summary": f"Review known age and mileage concerns for this {vehicle.year} {vehicle.make} {vehicle.model}.",
        "items": [
            {
                "title": "Inspect model-specific wear items",
                "category": "Known issues + prevention",
                "service_type": "Custom service",
                "rationale": "Ask a qualified mechanic to review common issues for this exact trim and engine at the current mileage before approving larger repairs.",
                "symptoms": "New noises, warning lights, fluid leaks, rough idle, vibration, or drivability changes.",
                "mechanic_questions": "Are there service bulletins or known pattern failures for this year, engine, and mileage?",
                "due_mileage": vehicle.current_mileage + 3000,
                "due_month_offset": 3,
                "estimated_min_cost": 100,
                "estimated_max_cost": 250,
            }
        ],
    }


def call_ai(vehicle, services):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("AI API key is not configured")
    client = OpenAI(api_key=api_key, base_url=os.getenv("OPENAI_BASE_URL") or None)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    service_history = [service.to_dict() for service in services[:15]]
    prompt = {
        "vehicle": vehicle.to_dict(),
        "service_history": service_history,
        "instructions": (
            "Return JSON only. Recommend 2-5 vehicle-specific maintenance or inspection items that go beyond routine oil and tires. "
            "Include possible known concerns by mileage, but never diagnose or guarantee failure. Each item needs title, category, "
            "service_type, rationale, symptoms, mechanic_questions, due_mileage, due_month_offset, estimated_min_cost, estimated_max_cost."
        ),
    }
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a cautious vehicle maintenance educator. Output valid compact JSON only."},
            {"role": "user", "content": json.dumps(prompt)},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


@api_bp.post("/vehicles/<int:vehicle_id>/recommendations/generate")
@jwt_required()
def generate_recommendations(vehicle_id):
    vehicle, failure = owned_vehicle(vehicle_id)
    if failure:
        return failure
    services = ServiceRecord.query.filter_by(vehicle_id=vehicle.id).order_by(ServiceRecord.service_date.desc()).all()
    try:
        result = call_ai(vehicle, services)
    except RuntimeError as exc:
        current_app.logger.warning("AI recommendation configuration error: %s", exc)
        return error(str(exc), 503)
    except json.JSONDecodeError:
        current_app.logger.exception("AI recommendation response was not valid JSON")
        return error("AI response was not valid JSON", 502)
    except Exception:
        current_app.logger.exception("AI recommendation generation failed")
        return error("AI recommendation generation failed. Check backend OpenAI configuration, model access, and billing.", 503)

    items = result.get("items")
    if not isinstance(items, list) or not items:
        return error("AI response did not include valid recommendations", 502)

    existing = AIRecommendationSet.query.filter_by(vehicle_id=vehicle.id).first()
    if existing:
        db.session.delete(existing)
        db.session.flush()
    recommendation_set = AIRecommendationSet(vehicle_id=vehicle.id, summary=result.get("summary") or "Vehicle-specific recommendations.", disclaimer=AI_DISCLAIMER)
    db.session.add(recommendation_set)
    db.session.flush()
    for item in items[:5]:
        try:
            recommendation_set.items.append(
                AIRecommendationItem(
                    title=str(item["title"])[:160],
                    category=str(item.get("category") or "Known issues + prevention")[:80],
                    service_type=str(item.get("service_type") or "Custom service")[:80],
                    rationale=str(item["rationale"]),
                    symptoms=str(item.get("symptoms") or ""),
                    mechanic_questions=str(item.get("mechanic_questions") or ""),
                    due_mileage=parse_int(item.get("due_mileage"), "due_mileage", required=False),
                    due_month_offset=parse_int(item.get("due_month_offset"), "due_month_offset", required=True),
                    estimated_min_cost=parse_float(item.get("estimated_min_cost"), "estimated_min_cost"),
                    estimated_max_cost=parse_float(item.get("estimated_max_cost"), "estimated_max_cost"),
                )
            )
        except (KeyError, ValueError):
            db.session.rollback()
            return error("AI response included an invalid recommendation item", 502)
    db.session.commit()
    return jsonify({"recommendations": recommendation_set.to_dict()})


@api_bp.patch("/recommendation-items/<int:item_id>")
@jwt_required()
def update_recommendation_item(item_id):
    item = AIRecommendationItem.query.get(item_id)
    if not item or item.recommendation_set.vehicle.user_id != int(get_jwt_identity()):
        return error("Recommendation item not found", 404)
    status = (request.get_json() or {}).get("status")
    if status not in {"pending", "approved", "rejected"}:
        return error("Invalid recommendation status")
    item.status = status
    db.session.commit()
    return jsonify({"item": item.to_dict()})
