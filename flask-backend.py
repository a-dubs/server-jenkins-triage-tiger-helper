# create simple flask backend that will receive a large json payload
# and save the payload to a file called payload.json
# The backend will also return a 200 and a happy message to the client
# when the payload is received and saved successfully

from flask import Flask, request, jsonify
import json
from datetime import datetime
import subprocess

app = Flask(__name__)

PORT = 6969


def merge_lists_of_dicts(list1, list2):
    merged_list = list1.copy()
    dict_set = {str(d) for d in list1}

    for item in list2:
        if str(item) not in dict_set:
            merged_list.append(item)
            dict_set.add(str(item))

    return merged_list

def get_latest_datetime_str(dates: list[str]) -> datetime:
    datetimes = [datetime.strptime(date.rsplit(",", maxsplit=1)[0], "%b %d, %Y") for date in dates]
    # sort the datetimes in descending order
    datetimes.sort(reverse=True)
    return datetimes[0]



# create ping endpoint 
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"}), 200


@app.route("/payload", methods=["POST"])
def payload():
    payload = request.get_json()
    try:
        with open("payload.json", "r") as f:
            existing_payload = json.load(f)
    # if file not found or json decode error
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print("Existing payload not found. Creating new payload file.")
        with open("payload.json", "w") as f:
            json.dump(payload, f)
    else:
        print("existing payload length:", len(existing_payload))
        merged_payload = merge_lists_of_dicts(existing_payload, payload)
        print("merged payload length:", len(merged_payload))
        with open("payload.json", "w") as f:
            json.dump(merged_payload, f)
    # generate the html tables
    subprocess.run(["python", "generate-html.py"])
    return jsonify({"message": "Payload received and merged successfully!"}), 200


# endpoint that returns the latest date of the payload data
@app.route("/num-jobs-to-fetch", methods=["GET"])
def num_jobs_to_fetch():
    try:
        with open("payload.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError as e:
        number_of_days = 30
    else:
        # get the "datetime" key from all the items in the payload and keep the latest date
        # in the format of "May 5, 2024, 6:41:10 PM"
        # latest_job = max([str(item["datetime"]).rsplit(",", maxsplit=1)[0] for item in data])

        # latest_job_datetime = datetime.strptime(latest_job, "%B %d, %Y")
        latest_job_datetime = get_latest_datetime_str([str(item["datetime"]) for item in data])
        print("Last job datetime:", latest_job_datetime)
        # get number of days since the latest date and then add 1
        # to get the number of jobs to fetch
        number_of_days = min((datetime.now() - latest_job_datetime).days + 1, 30)
    print("number of days:", number_of_days)
    return jsonify({"num_jobs_to_fetch": number_of_days}), 200


if __name__ == "__main__":
    app.run(port=PORT)
