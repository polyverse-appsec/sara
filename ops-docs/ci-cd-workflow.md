# CI/CD Workflow

This document describes the process/workflow used for CI/CD between GitHub Workflows and Vercel.

## Overview

**Last Updated:** 1/23/24

Any code committed to our trunk for development will go through this automatic CI/CD process:
* Commit code to `main`
* Build and deploy artifacts from `main` to Vercel `dev.boost.polyverse.com` domain
* Build and test code from `main`
* Merge code from `main` to `preview`
* Build and deploy artifacts from `preview` to Vercel `preview.boost.polyverse.com` domain
* Build and test code from `preview`
* Merge code from `preview` to `prod`

After the relevant code is merged into `prod` one can manually start a deployment to the Vercel `boost.polyverse.com` domain. See the section [Continuous Deployment: Deploying To Vercel](#Continuous-Deployment-Deploying-To-Vercel) for more details.

```mermaid
flowchart TD
    A[Developer] -- Check into `main` --> B((main branch))
    B -- Triggered on commit --> C[GH WF: Deploy To Dev]
    C -- Push artifacts --> D((dev.boost.polyverse.com))
    B -- Triggered on commit --> E[GH WF: Integrate To Preview]
    E --> F{Did tests pass?}
    F -- Tests failed --> G[Workflow fails]
    F -- Tests passed - merge --> H((preview branch))
    H -- Triggered on preview integration success --> I[GH WF: Deploy To Preview]
    I -- Push artifacts --> J((preview.boost.polyverse.com))
    J -- Triggered on preview deployment success --> K[GH WF: Integrate To Prod]
    K --> L{Did tests pass?}
    L -- Tests failed --> M[Workflow fails]
    L -- Tests passed - merge --> N((prod branch))
    N -- Manual trigger --> O[GH WF: Deploy To Prod]
    O -- Push artifacts --> P((boost.polyverse.com))
```