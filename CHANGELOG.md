# Polyverse Sara Web UI for Boost

# Release Notes

## Version 1.0.5: April 24th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- N/A

## Version 1.0.4: April 24th, 2024

### New Features

- N/A

### Enhancements

- Provide guidance in Project Health status if GitHub.com Repository is too large
- Improve UI in Repository selection for Project creation

### Bug Fixes

- N/A

## Version 1.0.3: April 23rd, 2024

### New Features

- N/A

### Enhancements

- Users can improve Sara analysis by providing feedback to Sara responses (e.g. Favorite, Insightful, Productive, or Unhelpful)

### Bug Fixes

- N/A

## Version 1.0.2: April 22nd, 2024

### New Features

- Sara can provide Visual Diagrams for source code flow control, class diagrams, interfaces and architecture

### Enhancements

- Users can Edit existing Project details - including Description and Guidelines to improve Sara's understanding
- Users can view the last GitHub.com source pull time and link to the specific Commit that was analyzed via the Project details page
- Users can view the history of Sara's product improvements by hovering over the Sara logo in the top left corner

### Bug Fixes

- N/A

## Version 1.0.1: April 21st, 2024

### New Features

- Enable Manual Source File Refresh for Projects, once Project reaches Healthy/Synchronized

### Enhancements

- Clarify User Data never used for training outside of User or their Organization
- Goals and Task Explorer UI Improvements
- Improvements to Project Resource footnotes in Sara answers

### Bug Fixes

- N/A

## Version 1.0.0: April 20th, 2024

### New Features

- N/A

### Enhancements

- Periodically refresh Project Healths on Projects page

### Bug Fixes

- N/A

## Version 0.20.19: April 19th, 2024

### New Features

- N/A

### Enhancements

- Add support for providing a public GitHub repo URL
- Enable Clipboard Copy of Goals and Tasks
- Navigation Bar UI Improvements
- Support for Goal-based Chat threads over 20 messages

### Bug Fixes

- N/A

## Version 0.20.18: April 19th, 2024

### New Features

- N/A

### Enhancements

- Show progress of Chat request/question processing
- Add Goal and Task Details in Navigation Bar to view Description, Acceptance Criteria and Status
- Improvements to Chat Response UI and Code Block rendering
- Enable Clipboard Copy of Sara Responses

### Bug Fixes

- N/A

## Version 0.20.17: April 19th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Fix issue with create Goals page not rendering

## Version 0.20.16: April 18th, 2024

### New Features

- N/A

- Improve Navigation Bar UI
- Improve Status/Chat UI
- Added navigation from Billing Account setup page to the parent Billing accounts page
- Added clipboard copy buttons to the Project and Goals pages for troubleshooting
- Enable Clipboard Copy of Project and Goal ids for troubleshooting

### Bug Fixes

- Fix issue with Navigation Bar scrolling
- Dark Mode UI fixes

## Version 0.20.15: April 17th, 2024

### New Features

- N/A

### Enhancements

- Improvements to Navigation Bar UI
- Improvements to Status/Chat UI
- Enable Navigation from Billing Account setup page to the parent Billing accounts page

### Bug Fixes

- N/A

## Version 0.20.14: April 16th, 2024

### New Features

- Waitlist support for when Sara reaches her capacity with new users

### Enhancements

- Make Goal Description an optional field when creating a new Goal
- Automatic retry of Chat requests that error out
- Enable customers to subscribe to news and updates via email on the Sara login page
- Highlight currently viewed Goal in the Navigation Bar

### Bug Fixes

- Fix Goal rendering in Navigation Bar when viewing a Goal page

## Version 0.20.13: April 15th, 2024

### New Features

- N/A

### Enhancements

- Improve Navigation Bar UI
- Show Chat Request Status next to latest Chat Response UI

### Bug Fixes

- Update scrolling of About page

## Version 0.20.12: April 13th, 2024

### New Features

- N/A

### Enhancements

- Show Project Health in left-hand Navigation Bar
- Added About Sara page for more information - including payment and data retention policy, 3rd party services used, and FAQ
- Improved page load transitions with Sara hints

### Bug Fixes

- Remove flashing error on Navigation Bar Account Status during loading
- Remove flashing Billing or User Session errors during loading

## Version 0.20.11: April 13th, 2024

### New Features

- N/A

### Enhancements

- Add Early Pre-Release Service Availability and refund policy to the top of all pages

### Bug Fixes

- N/A

## Version 0.20.10: April 12th, 2024

### New Features

- N/A

### Enhancements

- Add Feedback bar to the top of all pages
- Switch Support to Premium only - unpaid accounts can no longer create projects
- Significant improvements to Sara Welcome & Login page
- Enable Feedback to be submitted via Form

### Bug Fixes

- N/A

## Version 0.20.9: April 11th, 2024

### New Features

- N/A

### Enhancements

- Improve Sara's ability to find and reference full paths to Source files and the Architectural Blueprint
- Improvements to Page loading
- UI improvements for Chat Requests
- Automatically jump to default Learning Goal on Project Creation

### Bug Fixes

- N/A

## Version 0.20.8: April 10th, 2024

### New Features

- N/A

### Enhancements

- Disable inputs after pressing project create
- Increase real estate of Sara chat on screen (from 50% to 85%)

### Bug Fixes

- N/A

## Version 0.20.7: April 9th, 2024

### New Features

- N/A

### Enhancements

- Refreshed login page
- Added Sara OAuth App configuration page button in the settings page
- Added Sara OAuth App info/redirection links to login screen, create project page, and billing context create page
- Starter prompts now auto submit

### Bug Fixes

- Fixed navbar dark mode

## Version 0.20.6: April 8th, 2024

### New Features

- N/A

### Enhancements

- Navbar can now be dragged to expand

### Bug Fixes

- Removed org id getting passed into boost user status instead of org name

## Version 0.20.5: April 7th, 2024

### New Features

- N/A

### Enhancements

- Improve retrieval of project source files and annotations in the Assistant instructions
  - full references to project source files
  - Assistant estimates of time to project analysis completion is more precise based on # of files

### Bug Fixes

- N/A

## Version 0.20.4: April 6th, 2024

### New Features

- N/A

### Enhancements

- Improvements to Sara instructions for project source file retrieval and annotations.

### Bug Fixes

- N/A

## Version 0.20.3: April 5th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Use server timezone for timestamps in Assistant prompt (e.g. PST)

## Version 0.20.3: April 5th, 2024

### New Features

- N/A

### Enhancements

- UI improvements
- Improved Preview Feature enablement to work for all users, one user, or users in a specific org (e.g. @domain.com)
- Improve project creation UX and just re-direct to projects page after creating default goal without a chat

### Bug Fixes

- Protect against referencing out-of-bounds when getting the sync status

## Version 0.20.2: April 3rd, 2024

### New Features

- N/A

### Enhancements

- Improvements to Form input boxes in various Sara UI pages

### Bug Fixes

- N/A

## Version 0.20.1: April 2nd, 2024

### New Features

- N/A

### Enhancements

- Changed "billing org" to say "billing context" in the UI.
- /orgs will now always rediriect to /orgs/create if there are no orgs for user
- Billing context in user menu is now clickable, will redirect to billing context page or /orgs/create page if there is none selected
- Clicking on switch project will now redirect user to /orgs if there is no billing context selected
- Added personal/business badges to corresponding billing contexts
- Added Back buttons in /orgs/create
- Loading skeleton for project status in the project details tile

### Bug Fixes

- Fixed auth.ts passing in an org id instead of an org name into updating user boost backend

## Version 0.26.0: April 1st, 2024

### New Features

- User's personal github repos are now able to be selected for project creation
- Added distinction between personal and business billing contexts/github orgs

### Enhancements

- Navbar and settings page UI fixes
- Moved org github app installation status REST api to new path: orgs/[orgNameOrId]/status.
  - can put the name or id of an org in the slug depending on which one the api requires.
- Added github username to saraSession

### Bug Fixes

- Fixed org github app installation status checks for anything besides project creation org dropdown
- Fixed theme toggle not toggling on the first click

## Version 0.25.1: March 30th, 2024

### New Features

- N/A

### Enhancements

- N/A

### Bug Fixes

- Render new chat in correct area/box when using pre-canned messages to start new conversation

## Version 0.25.0: March 29th, 2024

### New Features

- Added theme toggle button to settings page

### Enhancements

- Improve the visual elements of chatting with Sara with a greeting and a UX specific message
  - Sara greeting for loading chat
  - Sara greeting for help with initial chat questions
  - Sara greeting for receiving an error
- Allow initial questions to be selected for the input of `<SaraChat>`
- Reworked select repo dropdown to display repos and then org
  - Show which repos are private and have been unlocked because of premium
- Added UI enhancements including adding plan comparison chart to org page
- Create projects is now blocked for private repos when user is not premium. It is unblocked for everything else

### Bug Fixes

- N/A

## Version 0.24.0: March 28th, 2024

### New Features

- N/A

### Enhancements

- Add REST API `DELETE /api/goals/<goalId>`
- Added functionality to the projects page to delete a set of selected goals from a project
- UI fixes for /orgs, /projects, navbar
- Added 'Sara {loading}...' style placeholders on pages that are busy loading
  - Avoids showing errors or partial data before ready to fully render
- Added support for Preview features in the UI

### Bug Fixes

- Fix issue in REST API `DELETE /api/projects/<projectId>` note actually cleaning up chats associated with goals

## Version 0.23.0: March 28th, 2024

### New Features

- N/A

### Enhancements

- Remove 'Hover For Details' text on hover items - to save screen real-estate

### Bug Fixes

- Fix issue with `<SaraChat>` component showing it was constantly loading instead of handling new chat requests
- Fix icons with the source re-synchronization
- Remove the `<SaraChat>` component from the individual projects page

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

- Distinguished Sara logo from user dropdown better
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
- Load the billing context for the Project Chat Page - avoid Select billing context error popup

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
- Added Premium Plan logo next to org on nav bar and applicable orgs in billing contexts page
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
- Disabled project creation if github app is not installed for selected billing context
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
