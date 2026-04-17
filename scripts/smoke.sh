#!/usr/bin/env bash
# Usage: ./scripts/smoke.sh [BASE_URL]
# Defaults to http://localhost:3000 if no URL provided.
# Exits 1 if any check fails — wire this into CI after deploy.

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "${GREEN}PASS${NC}  $name"
    ((PASS++))
  else
    echo -e "${RED}FAIL${NC}  $name  (expected HTTP $expected, got $actual)"
    ((FAIL++))
  fi
}

echo "Smoke testing: $BASE_URL"
echo "---"

# App is reachable
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
check "GET / → 200" "200" "$status"

# Auth routes reject unauthenticated callers
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" -d '{}')
check "POST /api/auth/send-otp (no session) → 401" "401" "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" -d '{"code":"123456"}')
check "POST /api/auth/verify-otp (no session) → 401" "401" "$status"

# Video generation rejects unauthenticated callers
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/videos/generate" \
  -H "Content-Type: application/json" -d '{}')
check "POST /api/videos/generate (no session) → 401" "401" "$status"

# Stripe webhook rejects missing signature
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/stripe" \
  -H "Content-Type: application/json" -d '{}')
check "POST /api/webhooks/stripe (no sig) → 400" "400" "$status"

# Shotstack webhook rejects missing/wrong token
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/shotstack" \
  -H "Content-Type: application/json" -d '{}')
check "POST /api/webhooks/shotstack (no token) → 403" "403" "$status"

# Tunnel status rejects non-UUID session IDs
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tunnel/status/not-a-uuid")
check "GET /api/tunnel/status/not-a-uuid → 400" "400" "$status"

# Tunnel upload rejects empty requests
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/tunnel/upload")
check "POST /api/tunnel/upload (empty) → 400" "400" "$status"

echo "---"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
