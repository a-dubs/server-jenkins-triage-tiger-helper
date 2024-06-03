#!/usr/bin/env python
# coding: utf-8

# In[ ]:


# i have a json list of values in payload.json in the format:
# [
#     {
#         datetime: str,
#         build_url: str,
#         failed_tests: [str],
#         test_report_page_url: str.
#         build_no: int,
#         job_name: str
#     }
# ]
# i want to create html tables from this json per job_name
# each table should have the job_name as a header before the table
# each table should have the following columns:
# 1. build_no
# 3. datetime
# 4. failed_tests
# 5. build_url
# 6. test_report_page_url
# the table should be sorted by build_no in descending order

import json
import subprocess

# read the json file
with open('payload.json', 'r') as f:
    data = json.load(f)

# group the data by job_name
grouped_data = {}
for item in data:
    job_name = item['job_name']
    if "ibm" not in job_name:
        if job_name not in grouped_data:
            grouped_data[job_name] = []
        grouped_data[job_name].append(item)

# sort each group by build_no so most recent builds are at the top
for job_name, items in grouped_data.items():
    items.sort(key=lambda x: x['build_no'], reverse=True)




def createTestHyperlink(url):
    # https://jenkins.canonical.com/server-team/view/cloud-init/testReport/junit/tests.integration_tests.modules/test_version_change/test_reboot_without_version_change/
    hyperlink = f'<a target="_blank" href={url}>'
    hyperlink += str(url.split("/junit/")[1]).replace("/", ".").strip(". ").rsplit(".", maxsplit=1)[1]
    hyperlink += "</a>"
    return hyperlink

def createAllTestsHyperlinkHTML(failed_tests):
    return "<br>".join([createTestHyperlink(test) for test in failed_tests])

# table of contents
# create a table that has columns of job_name (hyperlink to table below), date, and jobs that are failing
toc = '<h1>Table of Contents</h1>'
toc += '<table border="1"  style="margin-bottom: 200px;">'
toc += '<tr>'
toc += '<th>job_name</th>'
toc += '<th>date</th>'
toc += '<th>failed_tests</th>'
toc += '</tr>'
for job_name, items in grouped_data.items():
    item = items[0]
    toc += '<tr>'
    toc += f'<td><a href="#{job_name}">{job_name}</a></td>'
    toc += f'<td>{item["datetime"]}</td>'
    toc += '<td><div class="scrollable-cell-content">'
    toc += createAllTestsHyperlinkHTML(item["failed_tests"])
    toc += '</div></td>'
    toc += '</tr>'
toc += '</table>'
toc += '<br>'


# create the html tables
tables: list[str] = []
for job_name, items in grouped_data.items():
    table = f'<h1 id="{job_name}">{job_name}</h1>'
    table += '<button type="button" class="collapse-button">Toggle Table</button>'
    table += '<div class="content">'
    table += '<table border="1" style="margin-bottom: 200px;">'
    table += '<tr>'
    table += '<th>build_no</th>'
    table += '<th>datetime</th>'
    table += '<th>failed_tests</th>'
    table += '<th>build_url</th>'
    table += '<th>test_report_page_url</th>'
    table += '</tr>'
    items.sort(key=lambda x: x['build_no'], reverse=True)
    for item in items:
        table += '<tr>'
        table += f'<td>{item["build_no"]}</td>'
        table += f'<td style="white-space: nowrap;">{item["datetime"]}</td>'
        table += '<td><div class="scrollable-cell-content">'
        table += createAllTestsHyperlinkHTML(item["failed_tests"])
        table += '</div></td>'
        table += f'<td><div class="tiny-link-cell"><a target="_blank" href="{item["build_url"]}">{item["build_url"]}</a></div></td>'
        table += f'<td><div class="tiny-link-cell"><a target="_blank" href="{item["test_report_page_url"]}">{item["test_report_page_url"]}</a></div></td>'
        table += '</tr>'
    table += '</table>'
    table += '</div>'
    tables.append(table)


# write the html file
with open('triage-tiger.html', 'w') as f:
    f.write('''
<!DOCTYPE html>
<html>
<head>
    <title>Cloud-Init Jenkins Results</title>
    <style>
        .collapse-button {
            background-color: #777;
            color: white;
            cursor: pointer;
            padding: 18px;
            width: 100%;
            border: none;
            text-align: left;
            outline: none;
            font-size: 15px;
        }

        .content {
            padding: 0 18px;
            display: block;
            overflow: hidden;
            background-color: #f1f1f1;
        }
        .scrollable-cell-content {
            max-width: 500px; /* Set the maximum width */
            max-height: 200px; /* Set the maximum height */
            overflow: auto; /* Enable scrolling if content overflows */
            padding: 15px
        }
        .tiny-link-cell {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            
        }

    </style>
</head>
<body>
''')
    f.write(toc)
    f.write('\n'.join(tables))
    f.write('''
<script>
    var coll = document.getElementsByClassName("collapse-button");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
</script>
</body>
</html>
''')

print("triage-tiger.html created successfully!")
