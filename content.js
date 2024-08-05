
function cleanupExisting() {
    const customBranding = document.querySelector('.custom-branding')
    if (customBranding) {
        customBranding.remove()
    }
    const fetchButton = document.querySelector('.fetch-button')
    if (fetchButton) {
        fetchButton.remove()
    } 
}

function modifyBanner() {
    const target_div = document.querySelector("#page-header .logo");
    const custom_branding = document.createElement("div");
    custom_branding.classList.add("custom-branding");
    const custom_branding_text = document.createElement("h1");
    custom_branding_text.textContent = "Server Jenkins Browser Extension Active";
    custom_branding_text.style.color = "#aaa";
    custom_branding_text.style.fontSize = "12px";
    custom_branding_text.style.fontWeight = "normal";
    custom_branding_text.style.margin = "0";
    custom_branding.style.width = "50%";
    custom_branding.style.marginLeft = "20px";
    custom_branding_text.style.top = "50%";
    custom_branding_text.style.transform = "translateY(-50%)";
    custom_branding_text.style.position = "absolute";
    custom_branding.style.position = "relative";
    custom_branding.appendChild(custom_branding_text);
    target_div.appendChild(custom_branding);
}

async function ensureBackendIsRunning() {
    try {
        const response = await fetch('http://localhost:6969/ping');
        const data = await response.json();

        if (data.message === "pong") {
            console.log("Backend is running!");
            return true;
        } else {
            alert("Error connecting to backend server. Please ensure the triage-tiger server is running and try again.");
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error connecting to server. Please ensure the triage-tiger server is running and try again.");
        return false;
    }
}

function updateFetchButtonProgress(jobs_done, total_jobs) {
    const fetchButton = document.querySelector('.fetch-button')
    fetchButton.textContent = `Fetching cloud-init jobs results... ${jobs_done}/${total_jobs}`;
    const spinner_url = "https://global.discourse-cdn.com/sitepoint/original/3X/e/3/e352b26bbfa8b233050087d6cb32667da3ff809c.gif";
    const spinner = document.createElement('img');
    spinner.src = spinner_url;
    spinner.style.width = '20px';   
    spinner.style.height = '20px';
    spinner.style.marginLeft = '10px';
    fetchButton.appendChild(spinner);
}

function makeFetchButtonIntoSpinner() {
    const fetchButton = document.querySelector('.fetch-button')
    fetchButton.textContent = 'Fetching cloud-init jobs results...';
    fetchButton.color = '#05e679';
    fetchButton.disabled = true;
    const spinner_url = "https://global.discourse-cdn.com/sitepoint/original/3X/e/3/e352b26bbfa8b233050087d6cb32667da3ff809c.gif";
    const spinner = document.createElement('img');
    spinner.src = spinner_url;
    spinner.style.width = '20px';   
    spinner.style.height = '20px';
    spinner.style.marginLeft = '10px';
    fetchButton.appendChild(spinner);
}

function removeFetchButtonUponSuccess () {  
    const fetchButton = document.querySelector('.fetch-button')
    fetchButton.remove()
}

function sendPayload(payload) {
    fetch('http://localhost:6969/payload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        // alert the user that the data was successfully sent
        alert("Successfully scraped all job data and sent to server. Check for the triage-tiger.html file in the directory where you cloned the triage-tiger repo.");
        // remove the fetch button
        removeFetchButtonUponSuccess();
    })
    .catch(error => {
        console.error('Error:', error);
        if (error.message.includes("TypeError: NetworkError when attempting to fetch resource."))
        {
            alert("Error sending data to server. Please ensure the triage-tiger server is running and try again.");
        }
        else {
            alert("Error sending data to server. Check console logs for more info or please file a bug: https://github.com/a-dubs/server-jenkins-triage-tiger-helper/issues/new");
        }
    });
}

async function getNumberOfJobsToFetch() {
    try {
        const response = await fetch('http://localhost:6969/num-jobs-to-fetch');
        const data = await response.json();
        alert(`Scraping ${data.num_jobs_to_fetch} most recent jobs. This may take up to 5 minutes if the max number of jobs (30) need scraped.`);
        makeFetchButtonIntoSpinner();
        return data.num_jobs_to_fetch;
    }
    catch (error) {
        console.error('Error:', error); 
        if (error.message.includes("TypeError: NetworkError when attempting to fetch resource."))
        {
            alert("Error fetching number of jobs to scrape. Please ensure the triage-tiger server is running and try again.");
        }
    }
}

// this should only be run once upon document load
function main() {
    
    // Check if the current site's base URL is localhost:8080
    if (window.location.href.includes('jenkins.canonical.com/server-team')) {
        console.log("--- Server Jenkins Extension ---")
        cleanupExisting()
        modifyBanner()
        if (window.location.href === "https://jenkins.canonical.com/server-team/view/cloud-init/") {
            createFetchButton()
        }
    } else {
        // console.log('Extension is not active on this page.');
    }
}

function createFetchButton() {
    const fetchButton = document.createElement('button');
    fetchButton.textContent = 'Fetch cloud-init jobs results';
    fetchButton.style.position = 'fixed';
    fetchButton.style.top = '10';
    fetchButton.style.left = '50%';
    fetchButton.style.transform = 'translateX(-50%)';
    fetchButton.style.padding = '10px';
    fetchButton.style.backgroundColor = '#333';
    fetchButton.style.color = '#fff';
    fetchButton.style.border = '1px solid #fff';
    fetchButton.style.borderRadius = '5px';
    fetchButton.style.cursor = 'pointer';
    fetchButton.style.zIndex = '9999';
    fetchButton.classList.add('fetch-button');
    fetchButton.onclick = () => {
        console.log('fetch button clicked');
        console.log("crawling all integration jobs")
        ensureBackendIsRunning().then(isRunning => {
            console.log("Backend running status:", isRunning);
            if (isRunning) {
                crawlAllIntegrationJobs();
            }
        });
    }

    const target_div = document.querySelector("#page-header .logo");
    target_div.appendChild(fetchButton);

}

async function fetchDocument(url) {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc;
}

async function crawlAllIntegrationJobs() {
    const integrationJobsURLs = getIntegrationJobsURLs()
    // console.log(integrationJobsURLs)
    
    // for each url in the integrationJobsURLs list, fetch the document
    // then get the build history from the document via getAllJobsFromBuildHistory
    // and then create a json mapping each url to a list of build links
    const jobBuilds = {}
    const numberOfJobsToFetch = await getNumberOfJobsToFetch();
    console.log("numberOfJobsToFetch", numberOfJobsToFetch)
    await Promise.all(integrationJobsURLs.map(async (url) => {
        const doc = await fetchDocument(url);
        const jobBuildsList = getAllJobsFromBuildHistory(doc, numberOfJobsToFetch);
        console.log(`found ${jobBuildsList.length} builds for job ${url}`)
        jobBuilds[url] = jobBuildsList;
        // console.log(url, jobBuildsList);
    }));
    console.log("jobBuilds", jobBuilds)
    // get total number of builds to fetch
    const totalBuilds = Object.values(jobBuilds).reduce((acc, val) => acc + val.length, 0);
    console.log("TOTAL NUMBER OF BUILDS BEING SCRAPED:", totalBuilds)
    const testReports = []
    console.log("Creating test reports")
    var count = 0;
    const total = Object.keys(jobBuilds).length;
    for (const [jobUrl, buildUrls] of Object.entries(jobBuilds)) {
        count += 1;
        updateFetchButtonProgress(count, total);
        console.log(`[${count}/${total}]  processing ${buildUrls.length} number of builds for job ${jobUrl}`)
        for (const buildUrl of buildUrls) {
            const doc = await fetchDocument(buildUrl);
            const datetime = getDateTimeFromBuildPage(doc);
            const failedTestUrls = getAllFailedTestUrlsFromJobBuildPage(doc, buildUrl);
            const testReportUrl = makeTestReportUrlFromBuildUrl(buildUrl);
            const jobName = parseJobNameFromUrl(jobUrl);
            const buildNo = parseBuildNumberFromUrl(buildUrl);
            testReports.push({
                datetime: datetime,
                build_url: buildUrl,
                failed_tests: failedTestUrls,
                test_report_page_url: testReportUrl,
                build_no: buildNo,
                job_name: jobName
            });
        }
        console.log(`added ${buildUrls.length} test reports for ${jobUrl}`)
    }
    console.log("testReports", testReports)
    // now we have all the data we need

    // send the data to the server
    console.log("Sending payload to server")
    sendPayload(testReports)
}

function makeTestReportUrlFromBuildUrl(buildUrl) {
    // just append "testReport/" to the end of the build url
    return buildUrl + "testReport/"
}

function getDateTimeFromBuildPage(doc) {
    // ".jenkins-app-bar h1"
    // datetime will be enclosed in parentheses at the end of the h1 element
    const h1 = doc.querySelector('.jenkins-app-bar h1')
    const datetime = h1.textContent.split('(')[1].split(')')[0]
    return datetime
}

function parseJobNameFromUrl(url) {
    // https://jenkins.canonical.com/server-team/view/cloud-init/job/cloud-init-integration-focal-azure/403/
    // `cloud-init-integration-focal-azure` is desired job name
    const urlParts = url.split('/')
    const jobNameIndex = urlParts.indexOf('job') + 1
    return urlParts[jobNameIndex]
}

function parseBuildNumberFromUrl(url) {
    // https://jenkins.canonical.com/server-team/view/cloud-init/job/cloud-init-integration-focal-azure/403/
    // `403` is the build number
    const urlParts = url.split('/')
    const buildNumberIndex = urlParts.indexOf('job') + 2
    return parseInt(urlParts[buildNumberIndex])
}


function getAllFailedTestUrlsFromJobBuildPage(doc, buildUrl) {
    // all a elements in the #main-panel element whose href begins with "testReport/"
    const failedTests = doc.querySelectorAll('#main-panel .app-summary ul a[href^="testReport/"]')
    const failedTestUrls = []
    failedTests.forEach(test => {
        failedTestUrls.push(buildUrl + "testReport/" + test.href.split('testReport/')[1])
    })
    return failedTestUrls
}

// return list of all job urls in the build history
function getAllJobsFromBuildHistory(doc, maxJobs) {
    const jobRows = doc.querySelectorAll('#buildHistory tr.build-row');
    const jobLinks = [];
    console.log(`Fetching ${maxJobs} jobs from build history`);
    for (let i = 0; i < jobRows.length; i++) {
        const job = jobRows[i].querySelector('a.build-link.display-name');
        if (job) {
            jobLinks.push(job.href);
        }
        if (jobLinks.length >= maxJobs) {
            break; // exit the loop when maxJobs is reached
        }
    }
    return jobLinks;
}


// function that will get the all desired jobs from the #projectstatus table
function getIntegrationJobsURLs() {
    const suites = ["focal", "jammy", "mantic", "noble"]
    const integrationJobs = document.querySelectorAll('#projectstatus .model-link')
    const integrationJobsURLs = []
    integrationJobs.forEach(job => {
        // check if the job is a suite job
        suites.forEach(suite => {
            if (job.textContent.includes(suite)) {
                integrationJobsURLs.push(job.href)
            }
        })
    })
    return integrationJobsURLs
}

// waits for 
function getBuildHistory() {
    
}

main();