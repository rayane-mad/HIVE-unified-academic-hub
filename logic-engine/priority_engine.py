# logic-engine/priority_engine.py
from datetime import datetime, timedelta

def calculate_priority(due_date_string):
    """
    AI Priority Engine
    Input: due_date_string (ISO format, e.g., "2025-12-05T23:59:00")
    Output: "High", "Medium", "Low", or "Overdue"
    """
    now = datetime.now()
    # Parse the ISO string to a datetime object
    try:
        due_date = datetime.fromisoformat(due_date_string.replace('Z', ''))
    except ValueError:
        return "Error: Invalid Date Format"

    time_diff = due_date - now
    hours_diff = time_diff.total_seconds() / 3600

    if hours_diff < 0:
        return "Overdue"
    elif hours_diff <= 24:
        return "High"
    elif hours_diff <= 72: # 3 days
        return "Medium"
    else:
        return "Low"

if __name__ == "__main__":
    # Small test to see if it runs
    print("Engine is running...")