#!/bin/bash
set -e

echo "🧪 Testing @studiometa/productive-cli"
echo "======================================"
echo ""

# Test 1: Version
echo "✓ Test 1: Version"
./dist/cli.js --version
echo ""

# Test 2: Help
echo "✓ Test 2: Help (first 10 lines)"
./dist/cli.js --help | head -10
echo ""

# Test 3: Config validation (should fail without credentials)
echo "✓ Test 3: Config validation JSON format"
./dist/cli.js config validate --format json || true
echo ""

# Test 4: Config get
echo "✓ Test 4: Config get JSON format"
./dist/cli.js config --format json
echo ""

# Test 5: Projects help
echo "✓ Test 5: Projects command exists"
./dist/cli.js projects --help | grep -q "List projects" && echo "Projects command works!"
echo ""

# Test 6: Time help
echo "✓ Test 6: Time command exists"
./dist/cli.js time --help | grep -q "List time" && echo "Time command works!"
echo ""

# Test 7: No color mode
echo "✓ Test 7: No color mode"
./dist/cli.js --version --no-color
echo ""

# Test 8: Short aliases
echo "✓ Test 8: Short alias 'p' for projects"
./dist/cli.js p --help | head -5
echo ""

echo "======================================"
echo "✅ All basic tests passed!"
echo "📦 Package is ready for publication"
