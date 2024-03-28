# Polyverse Sara Web UI for Boost

# Release Notes

## Version 0.22.0: March 27th, 2024

### New Features

- N/A

### Enhancements

- Refactor data model to align with new type expectations
  - Remove usage of `Repository` type from old data model
  - Rename `ProjectDataSourcePartDeux` -> `ProjectDataSource`
- Update Source Synchronization icon
- Create project primary repo select dropdown now has repos from all orgs of user (besides personal)
  - Orgs in this dropdown will be unselectable if the github app is not installed for it.
- Highlight active goal/task in nav bar

### Bug Fixes

- N/A

## Version 0.21.0: March 26th, 2024

### New Features

- Add support for resynchronization of source files on user request (via Goal page)
  - This will only be enabled when existing project is fully synchronized

### Enhancements

- UI enhancements for billing status settings page, create projects page (input validation), sidebar
- Project guidelines now getting captured for project creation. Starting UI added for it

### Bug Fixes

- Fix issue Goal chat being disconnected from the response - endless spinning donut

## Version 0.20.0: March 25th, 2024

### New Features

- N/A

### Enhancements

- Enable support for private GitHub email authorization for Sara account creation
- Created separate DB instances for Vercel `preview` and `prod`
- Added delete button to project tiles in /projects
- Reduced settings button sizes
- Restyled nav-bar

### Bug Fixes

- Create project will more consistently redirect to auto submitted goal, otherwise redirect to project page

## Version 0.19.0: March 22nd, 2024

### New Features

- N/A

### Enhancements

- Refactor projects on nav bar to be a tree
- Edited appearnce of settings page to include checkboxes and configuration details
- Refactor project status/health into a Radix UI `<Card>` and `<HoverCard>`
- creating project will redirect to auto submitted goals page instead of to the projects page
- Project tiles now display time, upgrade premium button disabled if org is premium
- Add back to project button from goals page

### Bug Fixes

- N/A

## Version 0.18.0: March 21st, 2024

### New Features

- N/A

### Enhancements

- Refactor resource tree to provide consistent styling and not have overlapping text
- Goals on project page now rendered as a table
- Reworked settings page UX
- Removed hamburger user menu, replaced with settings page
- Orgs will now display if they are active (selected)
- Reworded some texts in UI
- Image instructions for authorizing github user app

### Bug Fixes

- N/A

## Version 0.17.0: March 20th, 2024

### New Features

- Added a new settings page with more detailed/streamlined walkthrough of account setup

### Enhancements

- Timestamps are now rendered on chat queries and chat responses
- Projects page now renders routable list of goals associated with project
- Goals can be created now via the UI
- Updated goal page to display more goal relevant information
- Reduced code redundancy for project health checks

### Bug Fixes

- Fix issue where the time a response from the LLM was received wasn't being recorded
- Fix content spacing separation/border issues on Project Resource page

## Version 0.16.4: March 20th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix issue where nav bar would flicker and re-render as it wasn't part of the `<RootLayout>` component/layout

## Version 0.16.3: March 19th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix issue where OpenAI Assistants could be created/updated with more than 3 files
- Fix issue where we don't guard against getting 3 file infos before config/updating Assistant

## Version 0.16.2: March 18th, 2024

### New Features

- N/A

### Enhancements

- Distinguished sara logo from user dropdown better
- Create project page submit UX is less confusing

### Bug Fixes

- Fix issue in Assistant prompt implying synchronization will complete immediately when it will take mins or hours or never
- Fix async issue with getting annotations from OpenAI and rendering the file that is cited

## Version 0.16.1: March 18th, 2024

### New Features

- N/A

### Enhancements

- UI improvements to Sara welcome/login page
- UI improvements to the Sara status messages
- Encourage Sara NOT to use the specific vector store filenames in her answers to the user - and instead use more general resource names like "Software Architectural Blueprint" - which are names also in the raw resources uploaded by Backend
- Set the Sara "Deployment" stage in the Assistant id for separation of data
- Enable Dark Mode support in the Sara UI
- Add User picture + Name to the Chat threads
- Add Titles / Hover Text to all UI images

### Bug Fixes

- Remove sample text from prompt input text box
- Load the Billing Organization for the Project Chat Page - avoid Select Billing Organization error popup

## Version 0.16.0: March 15th, 2024

### New Features

- N/A

### Enhancements

- Significant improvements to the Project Assistant training and guidance based on real-time Project Health and Project and Repo Information
- UI improvements to login, chat and project creation
- Added created on date to display for projects
- Upon log in, user will be redirected to the projects page of their first org if applicable
- Added project name and project status display to the nav bar
- UI improvements to the Sara status messages
- Added premium plan logo next to org on nav bar and applicable orgs in billing orgs page
- Show plan status inside each org page and if the org isn't premium, include link to upgrade
- Show project health for each of the projects in the projects list page
- Encourage Sara NOT to use the specific vector store filenames in her answers to the user - and instead use more general resource names like "Software Architectural Blueprint" - which are names also in the raw resources uploaded by Backend

### Bug Fixes

- N/A

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
