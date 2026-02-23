# logic-engine/app.py
from flask import Flask, request, jsonify
from priority_engine import calculate_priority

app = Flask(__name__)

@app.route('/')
def home():
    return "AI Priority Engine is Running!"

@app.route('/predict-priority', methods=['POST'])
def predict():
    """
    Endpoint that accepts JSON data:
    { "due_date": "2025-12-05T23:59:00" }
    
    Returns JSON:
    { "priority": "High" }
    """
    try:
        # 1. Get data from the request
        data = request.get_json()
        
        if not data or 'due_date' not in data:
            return jsonify({"error": "Missing 'due_date' field"}), 400
            
        # 2. Use your existing logic function
        priority_result = calculate_priority(data['due_date'])
        
        # 3. Return the result as JSON
        return jsonify({"priority": priority_result})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflict with React/Node
    app.run(port=5001, debug=True)