#!/bin/bash
export PATH="$(ls -d /root/.antigravity-ide-server/bin/* | head -n 1):$PATH"
npm run build
