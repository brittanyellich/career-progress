#!/bin/bash 

# Get Username from data/config.json
USERNAME=$(jq -r '.username' data/config.json)
COMPANY_NAME=$(jq -r '.companyName' data/config.json)

HEADER="# What's Happening This Week"
PR_TEMPLATE="## Ships :shipit:
{{range .}}
[{{ .title }}]({{ .url }})
{{end}}"
ISSUES_TEMPLATE="## Work Issues :woman_dancing:
{{range .}}
[{{ .title }}]({{ .url }})
{{end}}"
MY_ISSUES_TEMPLATE="## My Issues :raised_hands:
{{range .}}
[{{ .title }}]({{ .url }})
{{end}}"
 
# check whether user had supplied -h or --help . If yes display usage
if [[ ( $@ == "--help") ||  $@ == "-h" ]]
then 
	echo "update-weekly"
	echo "Usage: script/update-weekly"
	exit 0
fi 

# mac syntax
#START_DATE=$(date -v -Mon "+%Y-%m-%d")
#TOMORROW=$(date -v+1d "+%Y-%m-%d")

START_DATE=$(date -dlast-monday "+%Y-%m-%d")
TOMORROW=$(date -dtomorrow "+%Y-%m-%d")

PRS=$(gh search prs --author $USERNAME --owner $COMPANY_NAME --merged-at $START_DATE..$TOMORROW --json url,title --template "$PR_TEMPLATE")
WORK_ISSUES=$(gh search issues --assignee $USERNAME --owner $COMPANY_NAME --closed $START_DATE..$TOMORROW --json url,title --template "$ISSUES_TEMPLATE")
MY_ISSUES=$(gh search issues --assignee $USERNAME --owner $USERNAME --closed $START_DATE..$TOMORROW --json url,title --template "$MY_ISSUES_TEMPLATE")
CURRENT_ISSUE=$(gh issue list --label weekly -s open -L 1 --json url --jq '.[0].url')
PAST_ISSUE=$(gh issue list --label weekly -s closed -S 'sort:updated-desc' -L 1 --json url --jq '.[0].url')

echo $CURRENT_ISSUE
echo $PAST_ISSUE
echo $HEADER
echo $PRS
echo $ISSUES
gh issue edit $CURRENT_ISSUE --body \
"
[<< last week]($PAST_ISSUE)

$HEADER

$PRS

$WORK_ISSUES

$MY_ISSUES"
