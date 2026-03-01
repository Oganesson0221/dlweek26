from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_course_assignment_flow():
    # Create course
    r = client.post("/academic/courses", json={
        "code": "TEST101",
        "name": "Test Course",
        "term": "Y1S1"
    })
    assert r.status_code == 200
    course = r.json()
    assert "id" in course
    course_id = course["id"]

    # Create assignment
    r = client.post(f"/academic/submissions/courses/{course_id}/assignments", json={
        "title": "Test Assignment",
        "description": "Demo",
        "due_at": "2026-03-10T23:59:00",
        "weight": 0.2
    })
    assert r.status_code == 200
    assignment = r.json()
    assert assignment["status"] == "not_started"
    assignment_id = assignment["id"]

    # Reminders should exist
    r = client.get(f"/academic/submissions/assignments/{assignment_id}/reminders")
    assert r.status_code == 200
    reminders = r.json()
    assert isinstance(reminders, list)
    assert len(reminders) >= 1
    assert all(rem["status"] == "scheduled" for rem in reminders)

def test_deadline_suggestion():
    # Create course
    r = client.post("/academic/courses", json={
        "code": "TEST202",
        "name": "Deadline Course",
        "term": "Y1S1"
    })
    course_id = r.json()["id"]

    # Create assignment
    r = client.post(f"/academic/submissions/courses/{course_id}/assignments", json={
        "title": "Deadline Assignment",
        "description": "Demo",
        "due_at": "2026-03-20T23:59:00",
        "weight": 0.2
    })
    assignment_id = r.json()["id"]

    # Suggest start date
    r = client.post("/academic/deadlines/suggest_start", json={
        "assignment_id": assignment_id,
        "planned_hours": 10,
        "difficulty": "hard"
    })
    assert r.status_code == 200
    payload = r.json()
    assert "suggestion" in payload
    assert "workplan" in payload