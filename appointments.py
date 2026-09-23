import json
import os

FILE = "appointments.json"

def save_appointment(data):
    if os.path.exists(FILE):
        with open(FILE, "r") as f:
            appointments = json.load(f)
    else:
        appointments = []

    appointments.append(data)

    with open(FILE, "w") as f:
        json.dump(appointments, f)

    return True
