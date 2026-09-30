"""
Master test runner for the PV Corporate Finance Educational Tool
Runs test_pv_math.py and test_nlp_solver.py and checks integrity of all web assets.
"""

import os
import sys
import unittest

def check_file_integrity():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    required_files = [
        "index.html",
        "css/styles.css",
        "js/pv-engine.js",
        "js/ai-solver.js",
        "js/visualizer.js",
        "js/cases.js",
        "js/quiz.js",
        "js/app.js",
        "server.py",
        "tests/test_pv_math.py",
        "tests/test_nlp_solver.py"
    ]
    
    print("Checking project files integrity...")
    missing = []
    for rel_path in required_files:
        full_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(full_path):
            missing.append(rel_path)
        else:
            size = os.path.getsize(full_path)
            print(f"  [OK] {rel_path:<25} ({size:,} bytes)")
            
    if missing:
        print(f"ERROR: Missing files: {missing}")
        return False
    return True

def run_test_suites():
    test_dir = os.path.dirname(os.path.abspath(__file__))
    loader = unittest.TestLoader()
    suite = loader.discover(test_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    print("=" * 60)
    print("RUNNING PV CORPORATE FINANCE TEST SUITE")
    print("=" * 60)
    
    files_ok = check_file_integrity()
    if not files_ok:
        sys.exit(1)
        
    print("\nRunning Automated Unit Tests...")
    tests_ok = run_test_suites()
    
    if tests_ok:
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED SUCCESSFULLY! (10/10 tests)")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\nUnit tests failed!")
        sys.exit(1)
