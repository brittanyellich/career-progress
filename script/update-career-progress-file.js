const fs = require('fs');
const csv = require('csv-parser');
const yaml = require('js-yaml');

const currentLevelOutputFilePath = './.github/commands/current_level_progress.yml';
const nextLevelOutputFilePath = './.github/commands/next_level_progress.yml';
const configFilePath = './data/config.json';
const dataFilePath = './data/';

const version = 'version';
const titleTemplateSection = '{{ "| Id | Section | Description | Status |" }}\n'
const underTitleTemplateSection = '{{ "| ----- | ----- | ---- | ---- |" }}\n'
const currentLevelTitle = '## Current level';
const nextLevelTitle = '## Next level';

async function parseFile (filePath) {
    const csvData = [];
    // Parse sections CSV file
    return new Promise(resolve => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                csvData.push(data);
            })
            .on('end', () => {
                resolve(csvData);
            });
    })
}

function replaceSpaces(str) {
    return str.replace(/\s/g, '_');
}

async function main() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const currentFileName = dataFilePath + config.currentCareerLadderFileName;
    const nextFileName = dataFilePath + config.nextCareerLadderFileName;

    // Parse CSV file
    const currentCareerPathSections = await parseFile(currentFileName);
    const nextCareerPathSections = await parseFile(nextFileName);

    // Parse current career_progress.yml file
    const currentLevelProgressFile = yaml.load(fs.readFileSync(currentLevelOutputFilePath, 'utf8'));
    const nextLevelProgressFile = yaml.load(fs.readFileSync(nextLevelOutputFilePath, 'utf8'));

    // Update the body steps
    const newCurrentLevelBody = [];
    const newNextLevelBody = [];

    newCurrentLevelBody.push({
        type: 'markdown',
        attributes: {
            value: currentLevelTitle
        }
    })

    for (let section = 0; section < currentCareerPathSections.length; section++) {
        const id = `${replaceSpaces(currentCareerPathSections[section].section)}-${section}`
        newCurrentLevelBody.push({
            type: 'dropdown',
            attributes: {
                label: id,
                description: currentCareerPathSections[section].description,
                options: [
                    { label: "🟢 I've done this well multiple times", value: '🟢' },
                    {
                        label: "🟡 I've done this a few times and want to improve",
                        value: '🟡'
                    },
                    {
                        label: "🔴 I need to do more of this",
                        value: '🔴'
                    }
                ]
            }
        });
    }
    newNextLevelBody.push({
        type: 'markdown',
        attributes: {
            value: nextLevelTitle
        }
    })
    for (let section = 0; section < nextCareerPathSections.length; section++) {
        const id = `${replaceSpaces(nextCareerPathSections[section].section)}-${section}`
        newNextLevelBody.push({
            type: 'dropdown',
            attributes: {
                label: id,
                description: nextCareerPathSections[section].description,
                options: [
                    { label: "🟢 I've done this well multiple times", value: '🟢' },
                    {
                        label: "🟡 I've done this a few times or want to improve",
                        value: '🟡'
                    },
                    {
                        label: "🔴 I need to do more of this",
                        value: '🔴'
                    }
                ]
            }
        });
    }

    currentLevelProgressFile.steps[0].body = newCurrentLevelBody;
    nextLevelProgressFile.steps[0].body = newNextLevelBody;

    const existingCurrentLevelTemplate = currentLevelProgressFile.steps[1].template.split('\n');
    let versionNumber = 1;
    for (line of existingCurrentLevelTemplate) {
        if (line.startsWith(version)) {
            versionNumber = parseInt(line.split(' ')[1]);
            versionNumber++;
        }
    }
    const newCurrentLevelTemplate = [];
    const newNextLevelTemplate = [];

    newCurrentLevelTemplate.push(currentLevelTitle + '\n');
    newCurrentLevelTemplate.push(titleTemplateSection);
    newCurrentLevelTemplate.push(underTitleTemplateSection);
    for (let section = 0; section < currentCareerPathSections.length; section++) {
        const id = `${replaceSpaces(currentCareerPathSections[section].section)}-${section}`
        newCurrentLevelTemplate.push(`{{ "| ${id} | ${currentCareerPathSections[section].section} | ${currentCareerPathSections[section].description} | "}} {{ data.${id} }} {{" |"}}\n`);
    }
    newCurrentLevelTemplate.push('\n');
    newCurrentLevelTemplate.push('data: current_level_progress\n');
    newCurrentLevelTemplate.push(`version: ${versionNumber}\n`);

    newNextLevelTemplate.push(nextLevelTitle + '\n');
    newNextLevelTemplate.push(titleTemplateSection);
    newNextLevelTemplate.push(underTitleTemplateSection);
    for (let section = 0; section < nextCareerPathSections.length; section++) {
        const id = `${replaceSpaces(nextCareerPathSections[section].section)}-${section}`
        newNextLevelTemplate.push(`{{ "| ${id} | ${nextCareerPathSections[section].section} | ${nextCareerPathSections[section].description} | "}} {{ data.${id} }} {{" |"}}\n`);
    }
    newNextLevelTemplate.push('\n');
    newNextLevelTemplate.push('data: next_level_progress\n');
    newNextLevelTemplate.push(`version: ${versionNumber}\n`);

    currentLevelProgressFile.steps[1].template = newCurrentLevelTemplate.join("");
    nextLevelProgressFile.steps[1].template = newNextLevelTemplate.join("");

    // Dump the new file into the yaml files
    fs.writeFileSync(currentLevelOutputFilePath, yaml.dump(currentLevelProgressFile));
    fs.writeFileSync(nextLevelOutputFilePath, yaml.dump(nextLevelProgressFile));
}

main()
