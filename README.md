# Server Jenkins Triage Tiger Helper

## Purpose
The **Server Jenkins Triage Tiger Helper** is a Firefox extension designed to scrape integration jobs results from jenkins and send it to a local backend server.
The backend processes this data and generates a simple HTML site for easy viewing and analysis. 
This tool aims to streamline the process triaging issues with integration jobs by providing:
 - A quick glance at the most recent test results for each integration test job.
 - A table per integration job that will allow for quickly understanding all recent runs of the job, and which tests failed per run.

By doing the scraping via a browser extension, the is no worry about any SSO or authentication woes that would arise when using a traditional scraper 
or when trying to gather all this information via the jenkins API.


## Components
### Firefox Extension
- **content.js**: The main script that runs in the context of the web page to perform data scraping.
- **manifest.json**: The manifest file that defines the extension's metadata and permissions.
- **popup.html**: The HTML file for the extension's popup interface.

### Backend
- **flask-backend.py**: A Flask application that receives scraped data from the extension and processes it.

### HTML Generator
- **generate-html.py**: A Python script that converts the processed data into a simple HTML file, named `triage-tiger.html`.

## How to Use

### Download the Repository
1. Clone the repository using the following command:
   ```bash
   git clone https://github.com/a-dubs/server-jenkins-triage-tiger-helper.git
   ```
2. Navigate to the project directory:
   ```bash
   cd server-jenkins-triage-tiger-helper
   ```

### Installing the Firefox Extension

#### To Add Temporarily:
1. Open Firefox and navigate to `about:debugging`.
2. Click on "This Firefox" or "This Nightly".
3. Click "Load Temporary Add-on".
4. Navigate to the folder you checkout this repo to on your local machine.
5. Select the `manifest.json` file in the project directory.

#### To Add Persistently:
1. Open Firefox and navigate to `about:addons`.
2. Click on the gear cog icon ⚙️ in the top right and click on the `Install Add-On From File` option.
3. Navigate to the folder you checkout this repo to on your local machine.
5. Select the most recent `.xpi` file in `releases` directory inside the project directory.

### Setting Up the Backend
1. Ensure you have Python and any dependencies installed. You can install the dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the backend server:
   ```bash
   python flask-backend.py
   ```

### Scraping the Jenkins Results
1. Go to the server team jenkins site
2. Navigate to the dashboard page for the server team you are triaging for (i.e. cloud-init)
3. If this team is supported, a "Fetch job results" button will appear in the top banner of the site
4. Press the "Fetch job results" button and just wait.
5. The browser extension will ask the backend many days it has been since jobs were last scraped so that it scrapes the minimum amount of jobs necessary to avoid unnecessary load being put on the jenkins server.
6. Then the browser extension will automatically go and scrape all the jobs necessary.
7. You will be alerted when the scraping begins and when it ends and whether it was succesfull or not.

### Viewing the Generated HTML Site
1. Once the backend has processed the data, it will generate an HTML file named `triage-tiger.html`.
2. Locate the `triage-tiger.html` file in the project directory.
3. Open the `triage-tiger.html` file in any web browser to view the results.
