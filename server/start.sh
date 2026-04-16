#!/bin/sh
set -e

# worker handles heavy processing — gets more heap
node --max-old-space-size=1024 dist/workers/videoWorker.js &

# http server is mostly i/o — smaller heap is fine
node --max-old-space-size=512 dist/index.js
