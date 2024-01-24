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

## User Requests to Generate Tasks

**Last Updated:** 1/23/24

```mermaid
sequenceDiagram
    actor User
    participant chat.tsx
    participant route.ts
    participant sara.ts
    participant runs.ts
    participant assistantTools.ts
    participant actions.ts
    participant task-data-loader.tsx

    User -> chat.tsx: user hits send in the chat box
    chat.tsx -> chat.tsx: useChat hook
    chat.tsx ->> route.ts: incoming chat gets routed to sara.ts
    route.ts ->> sara.ts: await querySara()
    sara.ts ->> runs.ts: await handleRequiresActionStatus()
    Note right of sara.ts: if thread status ='requires-action'
    Note right of sara.ts: manages openAI interaction with thread, at certain points in time the threadruns 
    Note right of sara.ts: pause with a requires-action status". When it goes into requires-action, 
    Note right of sara.ts: we see if action type is 'submit_tool_ouputs'
    Note right of sara.ts: which means it needs to take some output from sara
    Note right of sara.ts: and run it on the tools you made available to her, and then get feedback to her
    runs.ts ->> assistantTools.ts: await submitTaskSteps()
    Note right of runs.ts: if openAI requires tool 'submitTaskSteps',  we give it this method
    Note right of runs.ts: get openAI output and turn it into task format (has submitTaskStepsAssistantFunction interface)
    Note right of runs.ts: after we build tasks to persist after we convert openai output to what we 
    Note right of runs.ts: see in our data base, for each task, go create it in the data base using createTask
    assistantTools.ts ->> actions.ts: createTask()
    Note right of assistantTools.ts: for every task generated by response
    Note right of actions.ts: saves task in redix database
    actions.ts -->> assistantTools.ts: return taskData
    assistantTools.ts -->> runs.ts: resolved Promise
    runs.ts -->> runs.ts: toolOutputs.push()
    Note left of runs.ts: give openAI output to put out or else it will hang
    runs.ts -->> sara.ts: resolved Promise
    sara.ts -->> route.ts: resolved Promise
    Note left of route.ts: if there is no saved chat currently, persistantAssistantMessagesCallback
    Note left of route.ts: will persist the messages as a new chat in a newpayload
    chat.tsx -->> chat.tsx: onFinish()
    Note left of chat.tsx: When the chat is finished ie messages sent to openai and response gets back, 
    Note left of chat.tsx: calls setChatStreamLastFinishedAt which sets the context of chatstreamlastfinished to new time, causing ui that
    Note left of chat.tsx: is watching that context to rerender
    chat.tsx ->> chat.tsx: setChatStreamLastFinishedAt()
    chat.tsx ->> task-data-loader.tsx: Watches context change for chatStreamLastFinishedAt and re renders when updated
    Note left of task-data-loader.tsx: useEffect() after re render triggers call to actions.ts
    task-data-loader.tsx ->> actions.ts: getTasksAssociatedWithProject() 
    actions.ts -->> task-data-loader.tsx: return tasks
```