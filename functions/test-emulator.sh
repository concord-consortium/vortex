#!/bin/bash
#
# Smoke tests for Firebase Functions running on the local emulator.
# Prerequisites: firebase emulators:start --only functions,firestore
#

BASE_URL="http://localhost:5001/vortex-e5d5d/us-central1"
PASS=0
FAIL=0

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

RUN_KEY="test-run-$$"
RUN_DATA=$(echo -n '{"name":"test-run","version":1}' | base64 | tr -d '\n')

echo "=== Test 1: saveExperimentRun — save experiment data ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=${RUN_KEY}&runData=${RUN_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {"temperature": 22.5, "humidity": 45}}')
check "returns success" '"success":true' "$RESULT"
check "returns Run saved" '"result":"Run saved"' "$RESULT"

echo ""
echo "=== Test 2: saveExperimentRun — save photo data ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=${RUN_KEY}&runData=${RUN_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"localPhotoUrl": "file:///tmp/test-photo.jpg"}')
check "returns success" '"success":true' "$RESULT"
check "returns photo URL" "photo://${RUN_KEY}/" "$RESULT"

# Extract the photo doc ID for Test 3
PHOTO_URL=$(echo "$RESULT" | grep -o "photo://${RUN_KEY}/[^\"]*")

echo ""
echo "=== Test 3: getExperimentPhoto — retrieve photo ==="
if [ -n "$PHOTO_URL" ]; then
  RESULT=$(curl -s "${BASE_URL}/getExperimentPhoto?src=${PHOTO_URL}")
  check "returns success" '"success":true' "$RESULT"
  check "returns photo path" 'file:///tmp/test-photo.jpg' "$RESULT"
else
  echo "  SKIP: no photo URL from Test 2"
  ((FAIL++))
fi

echo ""
echo "=== Test 4: createCodeForExperimentRun — generate sharing code ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/createCodeForExperimentRun" \
  -H "Content-Type: application/json" \
  -d "{\"runKey\": \"${RUN_KEY}\", \"runData\": \"${RUN_DATA}\"}")
check "returns success" '"success":true' "$RESULT"
check "returns code object" '"code":' "$RESULT"

# Extract code for Test 5
CODE=$(echo "$RESULT" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== Test 5: getUrlForExperimentRunCode — resolve code to URL ==="
if [ -n "$CODE" ]; then
  RESULT=$(curl -s "${BASE_URL}/getUrlForExperimentRunCode?code=${CODE}")
  check "returns success" '"success":true' "$RESULT"
  check "returns URL with runKey" "runKey=${RUN_KEY}" "$RESULT"
  check "returns URL with runData" "runData=${RUN_DATA}" "$RESULT"
else
  echo "  SKIP: no code from Test 4"
  ((FAIL++))
fi

echo ""
echo "=== Test 6: Error handling — missing parameters ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runData=dGVzdA==" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {}}')
check "missing runKey" '"Missing runKey in query string!"' "$RESULT"

RESULT=$(curl -s "${BASE_URL}/getExperimentPhoto")
check "missing src" '"Missing src in query string!"' "$RESULT"

RESULT=$(curl -s "${BASE_URL}/getUrlForExperimentRunCode?code=000000")
check "invalid code" '"Invalid code!"' "$RESULT"

RESULT=$(curl -s -X POST \
  "${BASE_URL}/createCodeForExperimentRun" \
  -H "Content-Type: application/json" \
  -d '{}')
check "missing runKey in body" '"Missing runKey in request body!"' "$RESULT"

echo ""
echo "=== Test 7: saveExperimentRun — missing runData ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=test-no-rundata" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {}}')
check "missing runData" '"Missing runData in query string!"' "$RESULT"

echo ""
echo "=== Test 8: saveExperimentRun — body without experiment or photo ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=test-empty-body&runData=${RUN_DATA}" \
  -H "Content-Type: application/json" \
  -d '{"something": "else"}')
check "returns error" '"success":false' "$RESULT"
check "missing experiment or photo" '"Missing experiment or localPhotoUrl in upload"' "$RESULT"

echo ""
echo "=== Test 9: createCodeForExperimentRun — missing runData in body ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/createCodeForExperimentRun" \
  -H "Content-Type: application/json" \
  -d '{"runKey": "test-no-rundata"}')
check "missing runData in body" '"Missing runData in request body!"' "$RESULT"

echo ""
echo "=== Test 10: getExperimentPhoto — invalid src format ==="
RESULT=$(curl -s "${BASE_URL}/getExperimentPhoto?src=not-a-photo-url")
check "returns error" '"success":false' "$RESULT"
check "invalid src photo url" '"Invalid src photo url: not-a-photo-url"' "$RESULT"

echo ""
echo "=== Test 11: getExperimentPhoto — doc does not exist ==="
RESULT=$(curl -s "${BASE_URL}/getExperimentPhoto?src=photo://fake-run/fake-doc")
check "returns error" '"success":false' "$RESULT"
check "photo does not exist" '"Photo does not exist!"' "$RESULT"

echo ""
echo "=== Test 12: getExperimentPhoto — doc exists but no photo data ==="
# Write a doc to Firestore emulator without localPhotoUrl via admin REST API
FIRESTORE_URL="http://localhost:8080"
# Use the emulator's REST API with an Authorization header to bypass security rules
AUTH_HEADER="Authorization: Bearer owner"
curl -s -X PATCH \
  "${FIRESTORE_URL}/v1/projects/vortex-e5d5d/databases/(default)/documents/runs/nophoto-run/photos/nophoto-doc" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"fields": {"someField": {"stringValue": "no-photo-here"}}}' > /dev/null
RESULT=$(curl -s "${BASE_URL}/getExperimentPhoto?src=photo://nophoto-run/nophoto-doc")
check "returns error" '"success":false' "$RESULT"
check "no photo data found" '"No photo data found!"' "$RESULT"

echo ""
echo "=== Test 13: getUrlForExperimentRunCode — code exists but missing runKey/runData ==="
# Write a code doc to Firestore emulator without runKey/runData
curl -s -X PATCH \
  "${FIRESTORE_URL}/v1/projects/vortex-e5d5d/databases/(default)/documents/codes/999999" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"fields": {"someField": {"stringValue": "incomplete"}}}' > /dev/null
RESULT=$(curl -s "${BASE_URL}/getUrlForExperimentRunCode?code=999999")
check "returns error" '"success":false' "$RESULT"
check "missing runKey or runData" '"Missing runKey or runData"' "$RESULT"

echo ""
echo "=== Test 14: errorMessage helper — invalid base64 ==="
RESULT=$(curl -s -X POST \
  "${BASE_URL}/saveExperimentRun?runKey=test-err&runData=!!!invalid-base64!!!" \
  -H "Content-Type: application/json" \
  -d '{"experiment": {}}')
check "returns error" '"success":false' "$RESULT"
check "error message via errorMessage()" '"Error decoding runData:' "$RESULT"

echo ""
echo "=== Test 15: CORS preflight ==="
HEADERS=$(curl -s -X OPTIONS \
  "${BASE_URL}/saveExperimentRun" \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -D - -o /dev/null)
check "Access-Control-Allow-Origin header" "access-control-allow-origin" "$(echo "$HEADERS" | tr '[:upper:]' '[:lower:]')"

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && exit 0 || exit 1
