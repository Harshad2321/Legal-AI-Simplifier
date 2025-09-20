"""
Test script for Legal AI Simplifier API
Run this to test all endpoints with sample data
"""
import asyncio
import httpx
import json
from pathlib import Path


BASE_URL = "http://localhost:8080"


async def test_health():
    """Test health endpoint"""
    print("🩺 Testing health endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()


async def test_upload_document():
    """Test document upload"""
    print("📄 Testing document upload...")
    
    # Create a sample text document
    sample_content = """
    SAMPLE SERVICE AGREEMENT
    
    This Service Agreement is entered into between ABC Company and XYZ Client.
    
    1. PAYMENT TERMS
    Payment shall be due within 30 days of invoice date. Late payments will incur a penalty of 5% per month.
    
    2. TERMINATION
    Either party may terminate this agreement with 30 days written notice. In case of breach, immediate termination without notice is permitted.
    
    3. LIABILITY
    ABC Company's liability shall not exceed the total amount paid under this agreement. Client agrees to indemnify ABC Company against any third-party claims.
    
    4. CONFIDENTIALITY
    Both parties agree to maintain confidentiality of all proprietary information shared during the term of this agreement.
    
    5. GOVERNING LAW
    This agreement shall be governed by the laws of California. Any disputes shall be resolved through binding arbitration.
    """
    
    # Save to temp file
    temp_file = Path("temp_contract.txt")
    temp_file.write_text(sample_content)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(temp_file, "rb") as f:
                files = {"file": ("sample_contract.txt", f, "text/plain")}
                response = await client.post(f"{BASE_URL}/api/v1/documents/upload", files=files)
                
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"Document ID: {data['document_id']}")
                    print(f"Filename: {data['filename']}")
                    print(f"Processing Status: {data['processing_status']}")
                    return data['document_id']
                else:
                    print(f"Error: {response.text}")
                    return None
    finally:
        # Clean up temp file
        if temp_file.exists():
            temp_file.unlink()
    
    print()


async def test_document_status(document_id):
    """Test document status check"""
    print(f"📊 Testing document status for {document_id}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/documents/{document_id}/status")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()


async def wait_for_processing(document_id, max_wait=60):
    """Wait for document processing to complete"""
    print(f"⏳ Waiting for document processing to complete...")
    
    for i in range(max_wait):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/v1/documents/{document_id}/status")
            if response.status_code == 200:
                status = response.json().get("status")
                print(f"Processing status: {status}")
                
                if status == "completed":
                    print("✅ Processing completed!")
                    return True
                elif status == "failed":
                    print("❌ Processing failed!")
                    return False
                
        await asyncio.sleep(1)
    
    print("⏰ Timeout waiting for processing")
    return False


async def test_summarize(document_id):
    """Test document summarization"""
    print(f"📝 Testing document summarization for {document_id}...")
    
    request_data = {
        "document_id": document_id,
        "language": "en",
        "max_length": 300
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/analysis/{document_id}/summarize",
            json=request_data
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Summary: {data['summary'][:200]}...")
            print(f"Language: {data['language']}")
            print(f"Word Count: {data['word_count']}")
            print(f"Confidence: {data['confidence_score']}")
        else:
            print(f"Error: {response.text}")
    
    print()


async def test_clauses(document_id):
    """Test clause extraction"""
    print(f"📋 Testing clause extraction for {document_id}...")
    
    request_data = {
        "document_id": document_id,
        "include_explanations": True
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/analysis/{document_id}/clauses",
            json=request_data
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total Clauses: {data['total_clauses']}")
            for clause in data['clauses'][:3]:  # Show first 3 clauses
                print(f"- {clause['title']} ({clause['category']}, {clause['risk_level']})")
                if clause.get('explanation'):
                    print(f"  Explanation: {clause['explanation'][:100]}...")
        else:
            print(f"Error: {response.text}")
    
    print()


async def test_ask_question(document_id):
    """Test Q&A functionality"""
    print(f"❓ Testing Q&A for {document_id}...")
    
    questions = [
        "What are the payment terms?",
        "How can this contract be terminated?",
        "What are the liability limitations?"
    ]
    
    for question in questions:
        request_data = {
            "document_id": document_id,
            "question": question,
            "context_limit": 3
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/analysis/{document_id}/ask",
                json=request_data
            )
            
            print(f"Q: {question}")
            if response.status_code == 200:
                data = response.json()
                print(f"A: {data['answer'][:200]}...")
                print(f"Confidence: {data['confidence_score']}")
            else:
                print(f"Error: {response.text}")
            print()


async def test_alerts(document_id):
    """Test risk alerts"""
    print(f"⚠️ Testing risk alerts for {document_id}...")
    
    request_data = {
        "document_id": document_id,
        "severity_threshold": "low"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/analysis/{document_id}/alerts",
            json=request_data
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total Alerts: {data['total_alerts']}")
            print(f"Risk Summary: {data['risk_summary']}")
            
            for alert in data['alerts'][:3]:  # Show first 3 alerts
                print(f"- {alert['title']} ({alert['risk_level']})")
                print(f"  {alert['description'][:100]}...")
                print(f"  Recommendation: {alert['recommendation'][:100]}...")
        else:
            print(f"Error: {response.text}")
    
    print()


async def main():
    """Run all tests"""
    print("🚀 Legal AI Simplifier API Test Suite")
    print("=" * 50)
    
    try:
        # Test health
        await test_health()
        
        # Test upload
        document_id = await test_upload_document()
        
        if not document_id:
            print("❌ Upload failed, cannot continue with other tests")
            return
        
        # Wait for processing
        if not await wait_for_processing(document_id):
            print("❌ Document processing failed or timed out")
            return
        
        # Test all analysis features
        await test_document_status(document_id)
        await test_summarize(document_id)
        await test_clauses(document_id)
        await test_ask_question(document_id)
        await test_alerts(document_id)
        
        print("✅ All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")


if __name__ == "__main__":
    # Install required packages: pip install httpx
    asyncio.run(main())