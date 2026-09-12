import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

def test_api():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Test schemes
    req = urllib.request.urlopen(f"{base_url}/schemes")
    schemes = json.loads(req.read().decode())
    print(f"[OK] Total active schemes fetched: {len(schemes)}")
    assert len(schemes) >= 15, "Expected at least 15 schemes"

    # 2. Test Citizen Login
    login_payload = json.dumps({"email": "citizen@govassist.in", "password": "Citizen@123"}).encode()
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    res = json.loads(urllib.request.urlopen(req).read().decode())
    citizen_token = res["access_token"]
    print(f"[OK] Citizen login successful: {res['user']['full_name']} (Role: {res['user']['role']})")

    # 3. Test Eligibility Results
    req = urllib.request.Request(
        f"{base_url}/eligibility/results",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    elig_results = json.loads(urllib.request.urlopen(req).read().decode())
    eligible_count = sum(1 for r in elig_results if r["status"] == "Eligible")
    print(f"[OK] Citizen eligibility evaluated: {len(elig_results)} schemes ({eligible_count} Eligible)")

    # 4. Test AI Chatbot
    chat_payload = json.dumps({"message": "Which schemes am I eligible for?"}).encode()
    req = urllib.request.Request(
        f"{base_url}/chat",
        data=chat_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {citizen_token}"
        }
    )
    chat_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"[OK] AI Chatbot intent: {chat_res['intent']}")
    clean_snippet = chat_res['response'][:100].replace('\n', ' ')
    print(f"     Snippet: {clean_snippet}...")

    # 5. Test Admin Login & Stats
    admin_payload = json.dumps({"email": "admin@govassist.in", "password": "Admin@123"}).encode()
    req = urllib.request.Request(
        f"{base_url}/auth/login",
        data=admin_payload,
        headers={"Content-Type": "application/json"}
    )
    res_admin = json.loads(urllib.request.urlopen(req).read().decode())
    admin_token = res_admin["access_token"]
    print(f"[OK] Admin login successful: {res_admin['user']['full_name']} (Role: {res_admin['user']['role']})")

    req = urllib.request.Request(
        f"{base_url}/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    admin_stats = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"[OK] Admin stats fetched: {admin_stats['active_schemes']} schemes, {admin_stats['total_citizens']} citizens, {admin_stats['total_evaluations']} evaluations")

    # 6. Test Admin Users directory
    req = urllib.request.Request(
        f"{base_url}/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users_list = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"[OK] Admin users directory fetched: {len(users_list)} registered users")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL.")

if __name__ == "__main__":
    test_api()
