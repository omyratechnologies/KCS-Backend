#!/bin/bash

# Jenkinsfile Syntax Validator
# This script performs basic syntax validation on the Jenkinsfile

set -e

echo "🔍 Validating Jenkinsfile syntax..."

# Check if Jenkinsfile exists
if [ ! -f "Jenkinsfile" ]; then
    echo "❌ Jenkinsfile not found in current directory"
    exit 1
fi

# Basic validation using Python
python3 << 'EOF'
import re
import sys

def validate_jenkinsfile():
    errors = []
    warnings = []
    
    try:
        with open('Jenkinsfile', 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading Jenkinsfile: {e}")
        return False
    
    lines = content.split('\n')
    in_sh_block = False
    brace_count = 0
    paren_count = 0
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Track shell blocks
        if re.search(r"sh\s+['\"][\"][\"]|sh\s+'''", line):
            in_sh_block = True
        elif in_sh_block and ("'''" in line or '"""' in line):
            in_sh_block = False
        
        # Check for common issues
        if not in_sh_block:
            # Shell commands outside sh blocks
            if re.match(r'\s*if\s+command\s+-v', line):
                errors.append(f"Line {i}: Shell command outside sh block: {stripped}")
            
            # Track braces
            brace_count += line.count('{') - line.count('}')
            paren_count += line.count('(') - line.count(')')
        
        # Check for common mistakes
        if 'moduleNameMapping' in line:
            warnings.append(f"Line {i}: Should be 'moduleNameMapper' not 'moduleNameMapping'")
        
        if 'isolatedModules: true' in line and 'jest' in content.lower():
            warnings.append(f"Line {i}: isolatedModules should be in tsconfig.json, not Jest config")
    
    # Final balance check
    if brace_count != 0:
        errors.append(f"Unbalanced braces: {brace_count}")
    
    if paren_count != 0:
        errors.append(f"Unbalanced parentheses: {paren_count}")
    
    # Report results
    if errors:
        print("❌ Syntax Errors Found:")
        for error in errors:
            print(f"  {error}")
        return False
    
    if warnings:
        print("⚠️ Warnings:")
        for warning in warnings:
            print(f"  {warning}")
    
    print("✅ Jenkinsfile syntax validation passed!")
    return True

if not validate_jenkinsfile():
    sys.exit(1)
EOF

# Additional validation using Jenkins Lint API if available
if command -v curl &> /dev/null; then
    echo "🌐 Attempting to validate with Jenkins Lint API..."
    
    # Try to validate with Jenkins lint (if Jenkins server is accessible)
    # This is optional and will not fail the script if unavailable
    if [ -n "$JENKINS_URL" ]; then
        echo "🔍 Validating against Jenkins server at $JENKINS_URL..."
        if curl -X POST -F "jenkinsfile=<Jenkinsfile" "$JENKINS_URL/pipeline-model-converter/validate" 2>/dev/null | grep -q "Jenkinsfile successfully validated"; then
            echo "✅ Jenkins server validation passed!"
        else
            echo "⚠️ Jenkins server validation failed or unavailable"
        fi
    else
        echo "ℹ️ JENKINS_URL not set, skipping server validation"
    fi
fi

echo "✅ Jenkinsfile validation completed successfully!"
exit 0
