#!/usr/bin/env bash
cd "$(dirname "$0")"
pip install -r requirements.txt -q 2>/dev/null || true
cd electron
if [ ! -d node_modules ]; then npm install; fi
npm start
