#!/bin/bash

echo "🔄 Reloading React Native app..."

# Send reload command to Metro bundler
echo "r" | nc -w 1 localhost 8081 2>/dev/null || echo "Metro server not responding"

echo "✅ Reload command sent. Check your device/emulator for the updated app."
echo ""
echo "📱 If the app doesn't reload automatically:"
echo "   - Press 'r' in the Metro terminal"
echo "   - Or shake your device and select 'Reload'"
echo "   - Or close and reopen the app"
