#!/usr/bin/env bash

set -euo pipefail

: "${EUROPDF_API_KEY:?EUROPDF_API_KEY must be set}"

ROOT="$(pwd)"
HTML="${ROOT}/hvcs/coexistence.html"
ASSETS="${ROOT}/europdf-assets.zip"
OUTPUT="${ROOT}/coexistence.pdf"

if [[ ! -f "${HTML}" ]]; then
    echo "HTML not found: ${HTML}" >&2
    exit 1
fi

rm -f "${ASSETS}" "${OUTPUT}"

echo "Packaging EuroPDF assets..."

(
    cd "${ROOT}"

    zip -r "${ASSETS}" \
        hvcs \
        images \
        scripts \
        styles \
        -x '2026.vs.2027/*' \
        -x 'hvcs/coexistence.html'
)

echo
echo "Generating PDF..."

curl --fail-with-body \
    "https://api.europdf.eu/v1/docs?api_key=${EUROPDF_API_KEY}" \
    -F "doc[pipeline]=Prince16.2" \
    -F "doc[test]=true" \
    -F "doc[document_content]=<${HTML}" \
    -F "doc[document_assets]=@${ASSETS};type=application/zip" \
    -o "${OUTPUT}"

echo
echo "Created: ${OUTPUT}"