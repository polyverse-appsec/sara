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
$ npm i -g Vercel
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



