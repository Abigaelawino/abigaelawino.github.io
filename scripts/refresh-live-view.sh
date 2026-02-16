#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
node refresh-live-view.mjs
