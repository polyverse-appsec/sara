# Class Diagram (Data Model)

This doc contains class diagrams that represent the Sara data model. They are typically MermaidJS markdown that can be used here: https://mermaid.live/

## Data Model

**Last Updated:** 2/13/24

```mermaid
---
title: Sara Data Model
---
classDiagram
    class Organization {
        id string
        userIds [string]
        title string
        projectIds [string]
    }

    class Project {
        id string
        orgId string
        userIds [string]
        title string
        description string
        status: string
        goalIds: [string]
        createdAt: ISO 8601 string
        lastUpdatedAt: ISO 8601 string
        closedAt: ISO 8601 string
    }

    class Goal {
        id string
        orgId string
        title string
        description string
        status: string
        chatId: string | null
        parentProjectId: string
        taskIds: [string]
        createdAt: ISO 8601 string
        lastUpdatedAt: ISO 8601 string
        closedAt: ISO 8601 string
    }

    class Task {
        id: string
        orgId: string
        title: string
        description: string
        status: string
        chatId: string | null
        parentGoalId: string | null
        parentTaskId: string | null
        subTaskIds: [string]
        createdAt: ISO 8601 string
        lastUpdatedAt: ISO 8601 string
        closedAt: ISO 8601 string
    }

    Organization <--> Project
    Project <--> Goal
    Goal --> Organization
    Goal <--> Task
    Task --> Organization
    Task <--> Task
```