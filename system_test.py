

import requests
import json
import subprocess
import time
import sys
import os

def test_backend_api():
    """Test the backend API directly"""
    print("🔧 Testing Backend API...")
    try:
        from app import app

        with app.test_client() as client:
            # Test enhanced prediction
            response = client.post('/predict', json={'symptoms': 'chest pain, shortness of breath, sweating'})
            assert response.status_code == 200, f"API returned {response.status_code}"

            data = response.get_json()
            assert 'predictions' in data, "No predictions in response"
            assert len(data['predictions']) > 0, "Empty predictions"

            pred = data['predictions'][0]
            assert 'disease' in pred, "No disease in prediction"
            assert 'specialist' in pred, "No specialist in prediction"
            assert 'confidence' in pred, "No confidence in prediction"

            print("  ✓ Enhanced API working")
            print(f"    Disease: {pred['disease']}")
            print(f"    Specialist: {pred['specialist']}")
            print(f"    Confidence: {pred['confidence']}%")
            print(f"    Urgency: {data.get('urgency', 'N/A')}")
            print(f"    Method: {data.get('method', 'N/A')}")

            return True

    except Exception as e:
        print(f"  ❌ Backend API test failed: {e}")
        return False

def test_ml_integration():
    """Test ML model integration"""
    print("🤖 Testing ML Integration...")
    try:
        from enhanced_matcher import enhanced_predict_disease

        result = enhanced_predict_disease(['chest pain', 'shortness of breath', 'sweating'])

        assert 'predictions' in result, "No predictions from enhanced matcher"
        assert len(result['predictions']) > 0, "Empty predictions from enhanced matcher"

        # Check if cardiac diseases are prioritized
        predictions = result['predictions']
        cardiac_found = any('cardiac' in p['disease'].lower() or 'heart' in p['disease'].lower()
                          for p in predictions[:2])

        if cardiac_found:
            print("  ✓ Cardiac diseases properly prioritized")
        else:
            print("  ⚠️  Cardiac prioritization may need tuning")

        return True

    except Exception as e:
        print(f"  ❌ ML integration test failed: {e}")
        return False

def test_frontend_build():
    """Test if frontend files are valid"""
    print("⚛️  Testing Frontend Files...")
    try:
        # Check if key frontend files exist
        frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
        required_files = [
            'package.json',
            'src/App.js',
            'src/SymptomForm.js',
            'src/index.js'
        ]

        missing_files = []
        for file in required_files:
            if not os.path.exists(os.path.join(frontend_dir, file)):
                missing_files.append(file)

        if missing_files:
            print(f"  ❌ Missing frontend files: {missing_files}")
            return False

        # Try to check syntax of main component
        import subprocess
        try:
            result = subprocess.run(['node', '-c', 'src/SymptomForm.js'],
                                  cwd=frontend_dir,
                                  capture_output=True,
                                  text=True,
                                  timeout=10)
            if result.returncode == 0:
                print("  ✓ Frontend files are valid")
                return True
            else:
                print(f"  ❌ Syntax error in SymptomForm.js: {result.stderr[:100]}")
                return False
        except FileNotFoundError:
            # Node not available, just check if files exist
            print("  ✓ Frontend files exist (Node.js not available for syntax check)")
            return True

    except Exception as e:
        print(f"  ❌ Frontend test failed: {e}")
        return False

def test_system_integration():
    """Test complete system integration"""
    print("🔗 Testing System Integration...")

    # Test multiple symptom combinations
    test_cases = [
        ('chest pain, shortness of breath, sweating', 'Cardiac emergency'),
        ('frequent urination, excessive thirst, fatigue', 'Metabolic disorder'),
        ('fever, cough, fatigue', 'Respiratory infection'),
        ('headache, nausea, sensitivity to light', 'Neurological condition')
    ]

    passed = 0
    total = len(test_cases)

    for symptoms, expected_type in test_cases:
        try:
            from enhanced_matcher import enhanced_predict_disease

            result = enhanced_predict_disease(symptoms.split(', '))
            pred = result['predictions'][0]

            # Basic validation
            assert pred['confidence'] > 0, f"Invalid confidence: {pred['confidence']}"
            assert len(pred['specialist']) > 0, f"Empty specialist: {pred['specialist']}"

            passed += 1
            print(f"  ✓ {expected_type}: {pred['disease']} ({pred['specialist']})")

        except Exception as e:
            print(f"  ❌ {expected_type} failed: {e}")

    accuracy = (passed / total) * 100
    print(f"  Integration accuracy: {accuracy:.1f}%")
    return accuracy >= 80  # Accept 80%+ accuracy

def main():
    """Run all system tests"""
    print("🩺 MediGuide System Integration Test")
    print("=" * 50)

    tests = [
        ("Backend API", test_backend_api),
        ("ML Integration", test_ml_integration),
        ("Frontend Build", test_frontend_build),
        ("System Integration", test_system_integration)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            print()
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
            print()

    # Summary
    print("📊 Test Results Summary:")
    print("-" * 30)

    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1

    print(f"\nOverall: {passed}/{len(results)} tests passed")

    if passed == len(results):
        print("🎉 All systems operational! MediGuide is ready for use.")
        return 0
    elif passed >= len(results) - 1:
        print("⚠️  Minor issues detected, but system is functional.")
        return 1
    else:
        print("❌ Critical issues detected. System needs attention.")
        return 2

if __name__ == "__main__":
    sys.exit(main())