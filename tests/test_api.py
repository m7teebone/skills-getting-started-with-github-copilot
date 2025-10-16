import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of original participants to restore after each test
    original = {k: v["participants"][:] for k, v in activities.items()}
    yield
    for k, v in activities.items():
        v["participants"] = original[k][:]


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unsubscribe_flow():
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure not in participants
    assert email not in activities[activity]["participants"]

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unsubscribe_nonexistent_participant():
    activity = "Chess Club"
    email = "notregistered@mergington.edu"

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404


def test_signup_nonexistent_activity():
    resp = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert resp.status_code == 404
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure known activity present
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    # use a test email not present in initial data
    test_activity = "Chess Club"
    test_email = "test.user@mergington.edu"

    # make sure it's not already present
    assert test_email not in activities[test_activity]["participants"]

    # sign up
    resp = client.post(f"/activities/{test_activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert test_email in activities[test_activity]["participants"]

    # duplicate sign-up should return 400
    resp_dup = client.post(f"/activities/{test_activity}/signup?email={test_email}")
    assert resp_dup.status_code == 400

    # unregister
    resp_del = client.delete(f"/activities/{test_activity}/participants?email={test_email}")
    assert resp_del.status_code == 200
    assert test_email not in activities[test_activity]["participants"]

    # deleting again should return 404
    resp_del2 = client.delete(f"/activities/{test_activity}/participants?email={test_email}")
    assert resp_del2.status_code == 404


def test_signup_nonexistent_activity():
    resp = client.post("/activities/Nonexistent/signup?email=foo@x.com")
    assert resp.status_code == 404


def test_unregister_nonexistent_activity():
    resp = client.delete("/activities/Nonexistent/participants?email=foo@x.com")
    assert resp.status_code == 404
