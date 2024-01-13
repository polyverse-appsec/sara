# Sara

- [Sara](#Sara)
  - [Quickstart](#Quickstart)
  - [Configuring For Development](#Configuring-For-Development)
    - [Configuring For Git Commits](#Configuring-For-Git-Commits)
  - [Running For Development](#Running-For-Development)
    - [Running Locally](#Running-Locally)
  - [Testing](#Testing)
    - [Running The Tests](#Running-The-Tests)
  - [Features](#Features)
    - [Model Providers](#Model-Providers)

## Quickstart

```bash
$ npm i -g vercel
$ vercel link
$ vercel env pull
$ pnpm install
$ pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Configuring For Development

### Configuring For Git Commits

We use `git` hooks to verify certain functionality before commits are made. Some configuration is required to setup these `git` hooks. To ensure that they are installed run `pnpm install` once you clone your repository.

## Running For Development

## Current Backend Project Testing Workflow
Currently, to upload project files to storage for Sara to use, you'll need to manually upload them with the scripy create_project.py located in the node-boost-api project in /scripts. It is also located in the /scripts folder in sara.
You will need to
1. Copy the script into the home directory of the project you want to upload to storage for sara to reference.
2. The script currently does not support blueprint generation, so you'll need to make sure you have the blueprint.md in the project directory before you run the script.
3. In the directory of the project you want to upload, run the command: 
  `python create_project.py --email [YOUR_GITHUB_EMAIL] --organization [ORGANIZATION_NAME] --github_uri [URI_OF_GITHUB_PROJ] --path_to_summarizer [PATH_TO_SUMMARIZER_SCRIPT]  --project_name [PROJ_NAME]`
  example usage:
  `python create_project.py --email aaron@polyverse.com --organization polyverse-appsec --github_uri https://github.com/polyverse-appsec/sara --path_to_summarizer ../summarizer/main.py  --project_name sara`
4. Project files sara needs should now be uploaded to aws storage and openai. 

### Running Locally

The following steps will setup your environment with Vercel Environment Variables so you can run it locally,

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`
4. Install dependencies: `pnpm install`
5. Run local development instance: `pnpm run dev`

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Testing

Tests will run before each time you make a `git commit`. To do so you will need to have the local instance of Sara running. You can learn more about how to run locally in the [Running Locally](#Running-Locally) section.

### Running The Tests

You can run the tests by running `pnpm run test`. Note that these tests require a local instance of Sara running. You can learn more about how to run locally in the [Running Locally](#Running-Locally) section.

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for OpenAI (default), Anthropic, Cohere, Hugging Face, or custom AI chat models and/or LangChain
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- Chat History, rate limiting, and session storage with [Vercel KV](https://vercel.com/storage/kv)
- [NextAuth.js](https://github.com/nextauthjs/next-auth) for authentication

### Model Providers

This template ships with OpenAI `gpt-3.5-turbo` as the default. However, thanks to the [Vercel AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), [Hugging Face](https://huggingface.co), or using [LangChain](https://js.langchain.com) with just a few lines of code.



