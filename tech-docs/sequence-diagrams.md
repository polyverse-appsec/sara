# Sequence Diagrams

This doc contains sequence diagrams throughout Sara. They are typically MermaidJS markdown that can be used here: https://mermaid.live/

## User Login With Auth Provider

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

## Updating OpenAI Assistant On Repository Change (Assistant Exists)

**Last Updated:** 1/11/24
This diagram presumes the OpenAI Assistant already exists. A different diagram would be used for when it didn't exist.

```mermaid
sequenceDiagram
    actor User
    participant React GlobalContextWatcher
    participant actions.ts
    participant backend.ts
    participant assistants.ts
    participant Boost REST API
    
    User -> React GlobalContextWatcher: UX Select Repo
    activate React GlobalContextWatcher
    React GlobalContextWatcher -->> React GlobalContextWatcher: updateAIOnRepositoryChange()

    React GlobalContextWatcher ->> actions.ts: tickleProjectFromRepoChange()
    actions.ts ->> backend.ts: ticketProject()
    backend.ts ->> Boost REST API: POST /api/user_project/repoOrgID/repoName
    Boost REST API ->> backend.ts: 200 OK
    backend.ts ->> actions.ts: resolved Promise<''>
    actions.ts ->> React GlobalContextWatcher: resolved Promise <''>

    React GlobalContextWatcher ->> actions.ts: getOrCreateAssistantForRepo()
    actions.ts ->> assistants.ts: configAssistant()

    Note right of assistants.ts: Excluding details of findAssistantForRepo()

    assistants.ts ->> backend.ts: getFileInfo()
    backend.ts ->> Boost REST API: GET /api/user_project/repoOrgID/repoName/data_references
    Boost REST API ->> backend.ts: 200 OK [ProjectDataReference]
    backend.ts ->> assistants.ts: resolved Promise<ProjectDataReference[]>
    assistants.ts ->> assistants.ts: updateAssistantPromptAndFiles()

    Note right of assistants.ts: updateAssistantPromptAndFiles() invoked as Assistant exists
    Note right of assistants.ts: If Assistant doesn't exist we would sequence createAssistantWithFileIDsFromRepo()

    assistants.ts ->> assistants.ts: mapFileInfoToPromptAndIDs()

    Note right of assistants.ts: Excluding details of OpenAI REST call

    assistants.ts ->> assistants.ts: getOpenAIAssistantInstructions()
    assistants ->> actions.ts: resolved Promise<Assistant>
    actions.ts ->> React GlobalContextWatcher: resolved Promise<Assistant>
    React GlobalContextWatcher ->> React GlobalContextWatcher: setSelectedRepository()

    deactivate React GlobalContextWatcher
```