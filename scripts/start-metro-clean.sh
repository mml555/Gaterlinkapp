#!/bin/bash

# Clean Metro start script to avoid Unicode display issues
echo "🚀 Starting Metro Bundler with clean output..."

# Set environment variables to reduce Unicode issues
export TERM=xterm-256color
export LC_ALL=en_US.UTF-8

# Clear any existing Metro processes
echo "🧹 Cleaning up existing Metro processes..."
pkill -f "react-native start" || true
pkill -f "metro" || true

# Wait a moment for processes to clean up
sleep 2

# Start Metro with minimal output
echo "📱 Starting Metro Bundler..."
echo "📍 Metro will be available at: http://localhost:8081"
echo "🔄 Press 'r' to reload, 'd' for dev menu, 'j' for DevTools"
echo "⏹️  Press Ctrl+C to stop Metro"
echo ""

# Start Metro with reduced output
npx react-native start --reset-cache --max-workers=2 --reset-cache
