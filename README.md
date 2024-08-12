# Career Progress

A common saying at GitHub is the following

> We use GitHub to build GitHub

This repository aims to use GitHub to build yourself.

This repository has a series of scripts and GitHub Actions aimed at the following:

- Tracking your current work
- Generating a [work log/brag document](https://jvns.ca/blog/brag-documents/#template) to keep track of what you get done day to day
- Assessing your current progress against your current and next level on your work's career ladder, to see what areas you should be working on
- Creating and tracking a development plan to track progress towards improving career-wise

## Set up

To set up this repository for your own career progression, do the following:

- Create labels for this repository under the `issues` tab of: `weekly`, `quarterly`
- Get a PAT for your organization with the following permissions and save it under the Actions secrets as `PAT`: `project`, `read:discussion`, `read:org`, `read:user`, `repo`
- Update the data/config.json file to include your username, your repo name, and company name information (use the company name that your company uses on GitHub (ex: `github`))
- Upload CSV files with your career ladder to the `data` folder for your current and your next career level. There's an example already in the data folder. Update the `currentCareerLadderFileName` and `nextCareerLadderFileName` file names in data/config.json appropriately.
- Run `npm run update-career-progress-file` to generate the current level progress and next level progress slash commands. Alternatively this will be done automatically by the `update-career-progress-file` GitHub Action when csv files are pushed to the data folder.
- Go through each of the workflows to un-comment out the scheduled Actions that you would like to use. The schedule `on` is currently commented out so that they don't run in this example repository.

