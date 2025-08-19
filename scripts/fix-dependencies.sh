#!/bin/bash

# Dependency Fix Script for GaterLink App
# Based on Context7 analysis and dependency audit

set -e

echo "🔧 GaterLink App - Dependency Fix Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Starting dependency fixes..."

# 1. Add missing animation dependencies (High Priority)
print_status "Adding missing animation dependencies..."
npm install react-native-reanimated@^3.0.0
npm install @react-native-masked-view/masked-view@^0.3.0
print_success "Animation dependencies added"

# 2. Update Async Storage (High Priority)
print_status "Updating Async Storage to latest version..."
npm install @react-native-async-storage/async-storage@^2.2.0
print_success "Async Storage updated"

# 3. Update development tools (Medium Priority)
print_status "Updating development tools..."
npm install --save-dev eslint@^9.33.0 jest@^30.0.5 typescript@^5.9.2 prettier@^3.6.2
print_success "Development tools updated"

# 4. Update React minor versions (Low Priority)
print_status "Updating React minor versions..."
npm install react@^19.1.1 react-test-renderer@^19.1.1
print_success "React versions updated"

# 5. Update iOS Pods
print_status "Updating iOS Pods..."
if [ -d "ios" ]; then
    cd ios
    pod install
    cd ..
    print_success "iOS Pods updated"
else
    print_warning "iOS directory not found, skipping pod install"
fi

# 6. Run audit to check for any new issues
print_status "Running security audit..."
npm audit

# 7. Check for any remaining outdated packages
print_status "Checking for remaining outdated packages..."
npm outdated

print_success "Dependency fixes completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Test your app thoroughly after these changes"
echo "2. Update your Babel config if needed for react-native-reanimated"
echo "3. Consider implementing automated dependency updates"
echo ""
echo "🔍 For detailed analysis, see: DEPENDENCY_ANALYSIS_REPORT.md"
