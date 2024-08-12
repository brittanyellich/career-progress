import fs from 'fs';
import {Octokit} from 'octokit';

const configFilePath = './data/config.json';
const dataMarker = 'data: weekly_reflection';

const markdownTemplate = `
## Level progress

## Development plan
`

function toFileName(name) {
    return name.replace(/\s/g, '_').toLowerCase();
}

function getCurrentTimeName(config) {
    const date = new Date();
    let currentTimeName;
    for (const time of config.time) {
        const startTime = new Date(time.startDate);
        const endTime = new Date(time.endDate);
        if (date.getTime() >= startTime.getTime() && date.getTime() <= endTime.getTime()) {
            currentTimeName = time.name;
        }
    }
    return currentTimeName;
}

function getBlankDocTemplate(currentTimeName, config) {
    let template = `# ${currentTimeName}\n` + markdownTemplate;
    for (const section of config.bragDocSections) {
        template += `\n## ${section.name}\n`
    }
    return template;
}

async function main() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const currentTimeName = getCurrentTimeName(config);
    const currentFileName = `./progress/${toFileName(currentTimeName, config)}.md`;
    // Check if current file name exists, if not create it
    if (!fs.existsSync(currentFileName)) {
        fs.writeFileSync(currentFileName, (getBlankDocTemplate(currentTimeName)));
    }

    // Get the comments from the github issue
    const repo = config.repo;
    const owner = config.username;
    const issueUrl = process.env.PREV_ISSUE_URL;
    const issueNumber = issueUrl.split('/').pop();
    let commentBody;
    let issueName;
    const issueLink = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;

    const octokit = new Octokit({
        auth: process.env.PAT
    });

    // Get the issue name
    await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
    }).then(({ data }) => {
        issueName = data.title
    });

    // Get the comments from the github issue
    await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber
    }).then(({ data }) => {
        data.forEach(comment => {
            if (comment.body.includes(dataMarker)) {
                commentBody = comment.body;
            }
        });
    });

    if (commentBody) {
        // Remove the data marker
        commentBody = commentBody.replace(dataMarker, '');

        // Split data by the headers
        const commentData = commentBody.split('## ');
        const commentDataMap = {};
        
        const arrayOfSections = [];
        config.bragDocSections.forEach(section => {
            arrayOfSections.push(section.name);
        });
        commentData.forEach(data => {
            //Read first line
            const lines = data.split('\n');
            if (arrayOfSections.includes(lines[0])) {
                commentDataMap[lines[0]] = lines.slice(1).join('\n');
            }
        });

        // Get current file data
        const currentFileData = fs.readFileSync(currentFileName, 'utf8');
        const currentFileDataMap = {};
        const currentFileDataArray = currentFileData.split('## ');
        currentFileDataArray.forEach(data => {
            const lines = data.split('\n');
            currentFileDataMap[lines[0]] = lines.slice(1).join('\n');
        });

        // Add text to the beginning of each section
        const issueText = `[${issueName}](${issueLink})`;
        for (const section in currentFileDataMap) {
            if (commentDataMap[section]) {
                // filter blank lines
                const cleanedCommentData = commentDataMap[section].split('\n').filter(line => line !== '' && line !== '\n').map(line => {
                    return line.startsWith(" ") ? `${line}\n` : `${line} ${issueText}\n`;
                }).join('');
                currentFileDataMap[section] = cleanedCommentData + currentFileDataMap[section];
            }
        }

        let newFileData = '';
        // Add each section to the file data
        for (const section in currentFileDataMap) {
            if (section.startsWith('#')) {
                newFileData += `${section}\n\n`;
            } else {
                newFileData += `## ${section}\n\n${currentFileDataMap[section]}`;
            }
        }

        // Write the new file data to the file
        fs.writeFileSync(currentFileName, newFileData);
    }
}

main();