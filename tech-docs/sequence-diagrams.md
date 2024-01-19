# Sequence Diagrams

- [Sequence Diagrams](#Sequence-Diagrams)
  - [User Login With GitHub Auth Provider](#User-Login-With-GitHub-Auth-Provider)
  - [`<AppProvider>` Monitors For User Session Changes](#AppProvider-Monitors-For-User-Session-Changes)
  - [User Selects Repository From Dropdown](#User-Selects-Repository-From-Dropdown)
  - [Tickling Projects & Updating OpenAI Assistant On Repository Change (Assistant Exists)](#Tickling-Projects--Updating-OpenAI-Assistant-On-Repository-Change-Assistant-Exists)

This doc contains sequence diagrams throughout Sara. They are typically MermaidJS markdown that can be used here: https://mermaid.live/

## User Login With GitHub Auth Provider

**Last Updated:** 1/18/24

```mermaid
sequenceDiagram
    actor User
    participant React SignInPage
    participant GitHub OAuth
    participant React Chat Layout
    
    Note right of User: User not yet logged in
    User -> React SignInPage: UX Click "Login with GitHub"
    React SignInPage ->> GitHub OAuth: signIn()
    GitHub OAuth ->> GitHub OAuth: User accepts OAuth app perms
    GitHub OAuth ->> React SignInPage: Re-render - Session data change (SessionProvider)
    React SignInPage ->> React Chat Layout: Re-direct to '/'
```

## `<AppProvider>` Monitors For User Session Changes

**Last Updated:** 1/18/24

```mermaid
sequenceDiagram
    actor User
    participant React AppProvider
    participant actions.ts
    participant Redis

    User -> React AppProvider: Logs in
    Note right of User: useSession() hook re-renders

    activate React AppProvider

    React AppProvider ->> React AppProvider: fetchUser()
    React AppProvider ->> actions.ts: getOrCreateUserFromSession()
    actions.ts ->> actions.ts: getUser()
    actions.ts ->> Redis: hgetall(user:<userID>)
    Redis ->> actions.ts: resolved Promise<User | null>
    actions.ts ->> React AppProvider: resolved Promise<User>

    Note right of actions.ts: Conditional - Create user if getUser() returns null

    actions.ts ->> actions.ts: createUser()
    actions.ts ->> Redis: hset(user:<userID>, user)
    Redis ->> actions.ts: resolved Promise<User>
    actions.ts ->> React AppProvider: resolved Promise<User>

    React AppProvider ->> React AppProvider: setUser(user)

    Note right of React AppProvider: setUser() is React state hook

    deactivate React AppProvider
```

## User Selects Repository From Dropdown

**Last Updated:** 1/18/24

```mermaid
sequenceDiagram
    actor User
    participant React GithubSelect
    participant actions.ts
    participant project.ts
    participant task.ts
    participant Redis

    User -> React GithubSelect: Selects a repository from dropdown

    activate React GithubSelect

    Note right of React GithubSelect: handleRepositoryChange is CB passed to GithubRepoSelect
    React GithubSelect ->> React GithubSelect: handleRepositoryChange()
    React GithubSelect ->> actions.ts: getOrCreateProjectFromRepository()
    actions.ts ->> actions.ts: getProject()
    actions.ts ->> Redis: hgetall(project:<repoName>:<userID>)
    Redis ->> actions.ts: resolved Promise<Project | null>
    actions.ts ->> React GithubSelect: resolved Promise<Project>

    Note right of actions.ts: Conditional - Create project if getProject() returns null

    actions.ts ->> project.ts: createNewProjectFromRepository(repo, user)

    Note right of project.ts: Construct Project object from Repo and User objects

    project.ts ->> task.ts: createDefaultProjectTask(project, userID)

    Note right of task.ts: Construct Task object from Project and userID

    task.ts ->> task.ts: createTask(task)
    task.ts ->> Redis: hset(task:<generatedTaskID>, task)
    Redis ->> task.ts: 

    task.ts ->> Redis: zadd(user:tasks:<userID>, member = task:<generatedTaskID>)
    Redis ->> task.ts: 

    task.ts ->> Redis: zadd(repo:tasks:projectID, member = task:<generatedTaskID>)
    Redis ->> task.ts: 

    project.ts ->> Redis: hset(project:<repoName>:<userID>, project)
    Redis ->> project.ts: 

    project.ts ->> actions.ts: resolved Promise<Project>
    actions.ts ->> React GithubSelect: resolved Promise<Project>

    Note right of React GithubSelect: Below are all <AppContext> hooks

    React GithubSelect ->> React GithubSelect: setSelectedRepository(repo)
    React GithubSelect ->> React GithubSelect: setSelectedProject(project)
    React GithubSelect ->> React GithubSelect: setSelectedProjectRepositories([repo])
    React GithubSelect ->> React GithubSelect: setSelectedActiveTask(project.defaultTask)

    deactivate React GithubSelect
```

## Tickling Projects & Updating OpenAI Assistant On Repository Change (Assistant Exists)

**Last Updated:** 1/11/24
This diagram presumes the OpenAI Assistant already exists. A different diagram would be used for when it didn't exist.

```mermaid
sequenceDiagram
    actor User
    participant React
    participant React GlobalContextWatcher
    participant actions.ts
    participant backend.ts
    participant assistants.ts
    participant Boost REST API
    
    User -> React: Selects a repository from dropdown
    Note left of React: Context updated by React GithubSelect

    React -> React GlobalContextWatcher: Re-render from context change

    activate React GlobalContextWatcher

    React GlobalContextWatcher ->> React GlobalContextWatcher: useEffect()

    Note left of React GlobalContextWatcher: useEffect depends on selectedProject/selectedProjectRepositories

    React GlobalContextWatcher ->> React GlobalContextWatcher: updateAIOnRepositoryChange()
    React GlobalContextWatcher ->> actions.ts: tickleProjectFromProjectChange(repos)

    loop selectedProjectRepositories (React Context state)
        actions.ts ->> backend.ts: ticketProject(repo, email)
        backend.ts ->> Boost REST API: POST /api/user_project/repoOrgID/repoName
        Boost REST API ->> backend.ts: 200 OK
        backend.ts ->> actions.ts: resolved Promise<''>
    end

    actions.ts ->> React GlobalContextWatcher: resolved Promise.all([<''>])

    React GlobalContextWatcher ->> actions.ts: getOrCreateAssistantForProject(selectedProject, selectedProjectRepositories)

    Note right of actions.ts: Conditionally create assistant if project doesn't have one

    actions.ts ->> assistants.ts: configAssistant(project, repos, email)

    loop repos
        assistants.ts ->> backend.ts: getFileInfo(repo, email)
        backend.ts ->> Boost REST API: GET /api/user_project/repoOrgID/repoName/data_references
        Boost REST API ->> backend.ts: 200 OK [ProjectDataReference]
        backend.ts ->> assistants.ts: resolved Promise<ProjectDataReference[]>
    end

    Note right of assistants.ts: Excluding details of findAssistantForRepo()

    assistants.ts ->> assistants.ts: updateAssistantPromptAndFiles(fileInfos, existingAssistant)

    Note right of assistants.ts: updateAssistantPromptAndFiles() invoked if Assistant exists
    Note right of assistants.ts: If Assistant doesn't exist we would sequence createAssistantWithFileIDsFromRepo()
    Note right of assistants.ts: createAssistantWithFileIDsFromRepo() behaves similarly to sequence if Assistant exists

    assistants.ts ->> assistants.ts: mapFileInfoToPromptAndIDs()
    assistants.ts ->> assistants.ts: getOpenAIAssistantInstructions()

    Note right of assistants.ts: Excluding details of OpenAI REST call (assistants.update)

    assistants.ts ->> actions.ts: resolved Promise<Assistant>
    actions.ts ->> React GlobalContextWatcher: resolved Promise<Assistant>

    deactivate React GlobalContextWatcher
```