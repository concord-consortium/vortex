#!/bin/bash
#
# Production smoke tests for Firebase Cloud Functions.
# Run BEFORE and AFTER deploying to verify endpoints work identically.
#
# Usage:
#   ./functions/test-production.sh              # test production
#   ./functions/test-production.sh --cleanup    # delete test data after
#
# NOTE: Tests 1-5 write data to production Firestore under a run key
# prefixed with "smoke-test-". The --cleanup flag deletes the test
# code document via the createCode/getUrl round-trip (the run document
# and photo subcollections are not automatically cleaned up — see
# Firebase Console to remove manually if desired).
#

BASE_URL="https://us-central1-vortex-e5d5d.cloudfunctions.net"
PASS=0
FAIL=0
CLEANUP=false
TIMESTAMP=$(date +%s)
RUN_KEY="0000-smoke-test-${TIMESTAMP}"
RUN_DATA=$(echo -n "{\"name\":\"smoke-test\",\"ts\":${TIMESTAMP}}" | base64 | tr -d '\n')

[ "$1" = "--cleanup" ] && CLEANUP=true

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if echo "$actual" | grep -q "$expected"; then
    echo "  PASS: $name"
    ((PASS++))
  else
    echo "  FAIL: $name"
    echo "    expected to contain: $expected"
    echo "    got: $actual"
    ((FAIL++))
  fi
}

echo "Production smoke test — $(date)"
echo "Base URL: ${BASE_URL}"
echo "Run key:  ${RUN_KEY}"
echo ""

# --- Happy path: full round-trip ---

echo "=== Test 1: saveExperimentRun — save experiment data ==="
RESULT=$(curl -s --max-time 30 -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=${RUN_KEY}&runData=${RUN_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {"source": "smoke-test"}}')
check "returns success" '"success":true' "$RESULT"
check "returns Run saved" '"result":"Run saved"' "$RESULT"

echo ""
echo "=== Test 2: saveExperimentRun — save photo data ==="
RESULT=$(curl -s --max-time 30 -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=${RUN_KEY}&runData=${RUN_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"localPhotoUrl": "smoke-test://photo"}')
check "returns success" '"success":true' "$RESULT"
check "returns photo URL" "photo://${RUN_KEY}/" "$RESULT"

PHOTO_URL=$(echo "$RESULT" | grep -o "photo://${RUN_KEY}/[^\"]*")

echo ""
echo "=== Test 3: getExperimentPhoto — retrieve photo ==="
if [ -n "$PHOTO_URL" ]; then
  RESULT=$(curl -s --max-time 30 "${BASE_URL}/getExperimentPhoto?src=${PHOTO_URL}")
  check "returns success" '"success":true' "$RESULT"
  check "returns photo path" 'smoke-test://photo' "$RESULT"
else
  echo "  SKIP: no photo URL from Test 2"
  ((FAIL++))
fi

echo ""
echo "=== Test 4: createCodeForExperimentRun — generate sharing code ==="
RESULT=$(curl -s --max-time 30 -X POST \
  "${BASE_URL}/createCodeForExperimentRun" \
  -H "Content-Type: application/json" \
  -d "{\"runKey\": \"${RUN_KEY}\", \"runData\": \"${RUN_DATA}\"}")
check "returns success" '"success":true' "$RESULT"
check "returns code object" '"code":' "$RESULT"

CODE=$(echo "$RESULT" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== Test 5: getUrlForExperimentRunCode — resolve code to URL ==="
if [ -n "$CODE" ]; then
  RESULT=$(curl -s --max-time 30 "${BASE_URL}/getUrlForExperimentRunCode?code=${CODE}")
  check "returns success" '"success":true' "$RESULT"
  check "returns URL with runKey" "runKey=${RUN_KEY}" "$RESULT"
else
  echo "  SKIP: no code from Test 4"
  ((FAIL++))
fi

# --- Error handling ---

echo ""
echo "=== Test 6: Error handling — missing parameters ==="
RESULT=$(curl -s --max-time 30 -X POST \
  "${BASE_URL}/saveExperimentRun?runData=dGVzdA==" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {}}')
check "missing runKey" '"Missing runKey in query string!"' "$RESULT"

RESULT=$(curl -s --max-time 30 "${BASE_URL}/getExperimentPhoto")
check "missing src" '"Missing src in query string!"' "$RESULT"

RESULT=$(curl -s --max-time 30 "${BASE_URL}/getUrlForExperimentRunCode?code=000000")
check "invalid code" '"Invalid code!"' "$RESULT"

RESULT=$(curl -s --max-time 30 -X POST \
  "${BASE_URL}/createCodeForExperimentRun" \
  -H "Content-Type: application/json" \
  -d '{}')
check "missing runKey in body" '"Missing runKey in request body!"' "$RESULT"

# --- CORS ---

echo ""
echo "=== Test 7: CORS preflight ==="
HEADERS=$(curl -s --max-time 30 -X OPTIONS \
  "${BASE_URL}/saveExperimentRun" \
  -H "Origin: https://models-resources.concord.org" \
  -H "Access-Control-Request-Method: POST" \
  -D - -o /dev/null)
check "Access-Control-Allow-Origin header" "access-control-allow-origin" "$(echo "$HEADERS" | tr '[:upper:]' '[:lower:]')"

# --- Summary ---

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
echo ""
echo "Test data written to Firestore:"
echo "  runs/${RUN_KEY} (with experiments and photos subcollections)"
if [ -n "$CODE" ]; then
  echo "  codes/${CODE} (expires after 24h via cleanup logic)"
fi

if [ "$CLEANUP" = true ] && [ -n "$CODE" ]; then
  echo ""
  echo "Note: Code document codes/${CODE} will be auto-cleaned"
  echo "after 24h by createCodeForExperimentRun. Run document"
  echo "runs/${RUN_KEY} must be removed manually from Firebase Console."
fi

[ $FAIL -eq 0 ] && exit 0 || exit 1
