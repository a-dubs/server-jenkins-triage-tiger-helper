# create simple flask backend that will receive a large json payload
# and save the payload to a file called payload.json
# The backend will also return a 200 and a happy message to the client
# when the payload is received and saved successfully

import datetime
import json
import subprocess

from flask import Flask, jsonify, request

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


@app.route("/payload", methods=["POST"])
def payload():
    request_payload = request.get_json()
    try:
        with open("payload.json", "r", encoding="utf-8") as f:
            existing_payload = json.load(f)
    except FileNotFoundError:
        existing_payload = []
    print("existing payload length:", len(existing_payload))
    merged_payload = merge_lists_of_dicts(existing_payload, request_payload)
    print("merged payload length:", len(merged_payload))
    with open("payload.json", "w", encoding="utf-8") as f:
        json.dump(merged_payload, f)
    # generate the html tables
    subprocess.run(["python", "generate-html.py"], check=True)
    return (
        jsonify({"message": "Payload received and merged successfully!"}),
        200,
    )


# endpoint that returns the latest date of the payload data
@app.route("/num-jobs-to-fetch", methods=["GET"])
def num_jobs_to_fetch():
    try:
        with open("payload.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return jsonify({"num_jobs_to_fetch": 1}), 200
    # get the "datetime" key from all the items in the payload and keep the latest date
    # in the format of "May 5, 2024, 6:41:10 PM"
    latest_job = max(
        [str(item["datetime"]).rsplit(",", maxsplit=1)[0] for item in data]
    )

    latest_job_datetime = datetime.datetime.strptime(latest_job, "%B %d, %Y")
    # get number of days since the latest date and then add 1
    # to get the number of jobs to fetch
    number_of_days = (datetime.datetime.now() - latest_job_datetime).days + 1
    print("number of days:", number_of_days)
    return jsonify({"num_jobs_to_fetch": number_of_days}), 200


if __name__ == "__main__":
    app.run(port=PORT)
