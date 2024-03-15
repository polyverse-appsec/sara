# Polyverse Sara Web UI for Boost

# Release Notes

## Version 0.15.0: March 14th, 2024

### New Features

- N/A

### Enhancements

- Added advanced project configuration button which includes old checkbox selection menu and project description
- Changed wording on status texts in UI to clearer represent purposes
- Cleaned up UI
- whenever user navigates to the main page, it will automatically set the user's org to be the first of the fetched orgs. otherwise it will stay on the create orgs screen
- Moved organizations button into the user dropdown
- Updated project creation dates to display in a more understandable manner
- Goals and Tasks now support acceptance criteria

### Bug Fixes

- Update list of task IDs for a goal when Sara generates new tasks

## Version 0.14.0: March 13th, 2024

### New Features

- N/A

### Enhancements

- Add REST API for updating a projects file info used in prompt engineering `POST /api/projects/<projectId>/refresh`
- Modify project creation API to not create Open AI assistant `POST /api/orgs/orgId/projects`
  - These details of Open AI assistant creation and updating the prompt get deferred to `POST /api/projects/<projectId>/refresh`
- Added notification warnings for user plan, and github app installations
- Disabled project creation if github app is not installed for selected billing org
- Renamed buttons and text to clarify their purpose
- Added branding to the login page

### Bug Fixes

- N/A

## Version 0.13.0: March 12th, 2024

### New Features

- N/A

### Enhancements

- Add REST API for getting project health `GET /api/projects/<projectId>/health`

### Bug Fixes

- In old UI when `New Chat` clicked navigate to `/chat` instead of `/`

## Version 0.12.0: March 12th, 2024

### New Features

- N/A

### Enhancements

- Block project creation unless user has GitHub App installed for org and is also a premium user

### Bug Fixes

- Correctly identify if a user is a premium user for `GET /api/orgs/<orgId>/users/<userId>/status`

## Version 0.11.1: March 11th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Add AuthZ to `GET /api/goals/<goalId>`

## Version 0.11.0: March 11th, 2024

### New Features

- Sara writes tasks to the DB now associated with goals

### Enhancements

- Disable project creation button if GitHub app not installed based on org user status level

### Bug Fixes

- N/A

## Version 0.10.0: March 6th, 2024

### New Features

- Add REST API for creating chat queries associated with a chat `POST /api/goals/goalId/chats/chatId/chat-queries`

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.9.0: March 6th, 2024

### New Features

- Add REST API for getting chat queries associated with a chat `GET /api/goals/goalId/chats/chatId/chat-queries`

### Enhancements

- Render goals associated with a project

### Bug Fixes

- Fix issue with parsing the wrong URI segment for the goal ID and chat ID in `GET /api/goals/goalId/chats/chatId/chat-queries`
- Fix issue with not submitting output back to OpenAI Assistant thread when handling action

## Version 0.8.1: March 5th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix data member access on assistant metadata when searching for them

## Version 0.8.0: March 5th, 2024

### New Features

- Add REST API for supporting asynchronous chats around project goals `/api/goals/goalId/chats`

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.7.2: March 5th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix issue where Boost backend can return different formats when getting all projects associated with user

## Version 0.7.1: February 29th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix issue where user wasn't getting created on first login
- Fix issue where tasks couldn't be located from incorrect tasks key
- Fix issue where project creation would timeout as a server action (temporary REST API used)
- Fix issue where OpenAI resources not cleaned up on project deletion
- Fix issue where version wasn't being used in the naming/metadata of OpenAI assistants
- Fix issue where file IDs weren't present on created OpenAI assistants
- Fix issue where tasks weren't getting deleted when a project was deleted

## Version 0.7.0: February 22nd, 2024

### New Features

- Project creation and management UI (search, delete)

### Enhancements

- Assistants for Sara Projects are specific to org, user and project
  - Previously, Assistants were shared with any matching project name

### Bug Fixes

- N/A

## Version 0.6.2: February 13th, 2024

### New Features

- N/A

### Enhancements

- Synchronized timestamp of Project Data References with REST Backend JSON naming (camelCase)
- Cache file references for future use when configuring OpenAI Assistant
- Update file references in OpenAI Assistant when chat initiated

### Bug Fixes

- N/A

## Version 0.6.1: February 7th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix for having loading dots (`...`) appear while Sara is working on a chat request (already have spinner)
- Fix assistant configuration to retry on a loop until success or repo change
- Fix placement of UI status info to the bottom of the page in a <Footer>

## Version 0.6.0: February 5th, 2024

### New Features

- N/A

### Enhancements

- Sara now displays the last time a project was synchronized at

### Bug Fixes

- Prevent user tasks from bleeding into other users spaces on a per project basis

## Version 0.5.4: January 31th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Use the correct name property of a project to allow saving and rendering of tasks
- Handle the `failed` state of an OpenAI thread run to prevent 404s on timing out

## Version 0.5.3: January 30th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Properly create/update Sara with file info for her prompt on repository change

## Version 0.5.2: January 26th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- 404s no longer occur as a result of Sara not being fully configured yet

## Version 0.5.1: January 25th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Auth endpoint redirects to correct host on a per environment basis

## Version 0.5.0: January 22nd, 2024

### New Features

- Added Private Repository Authorization link to Sara menu
- Added Premium Subscription payment link to Sara menu

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.4.0: January 18th, 2024

### New Features

- Switched to Signed Headers for Sara authentication against backend

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.3.0: January 16th, 2024

### New Features

- Support for access to Dev, Test and Production backend Boost Service APIs

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.2.0: December 30th, 2023

### New Features

- Implement React TaskTree component
  - Note: Business logic not yet hooked up

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 0.1.0: December 21st, 2023

### New Features

- Personalized web UI integrates GitHub OAuth for user to ask chat questions of their private projects
- Integrates full summary, blueprint and overall code specs
- NOTE: Harcoded to Thrv.com lighthouse customer testing project
- Vercel.com Hosted Deployment

### Enhancements

- N/A

### Bug Fixes

- N/A
