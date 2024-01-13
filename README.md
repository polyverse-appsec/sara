# Sara

- [Sara](#Sara)
  - [Quickstart](#Quickstart)
  - [Design & Technical Docs](#Design--Technical-Docs)
  - [Committing Code](#Committing-Code)
  - [Running For Development](#Running-For-Development)
    - [Running Locally](#Running-Locally)
  - [Testing](#Testing)
    - [How The Tests Work](#How-The-Tests-Work)
    - [Testing With `node-boost-api` Service](#Testing-With-node-boost-api-Service)
  - [Features](#Features)
    - [Model Providers](#Model-Providers)
  - [Resources](#Resources)

## Quickstart

If you haven't yet installed `pnpm` you can do so by running the following: `curl -fsSL https://get.pnpm.io/install.sh | sh -`

```bash
$ pnpm add -g vercel
$ vercel link
$ vercel env pull
$ pnpm install
$ pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Design & Technical Docs

* [Sequence Diagrams](tech-docs/sequence-diagrams.md)

## Committing Code

![We Be 2 Fast 2 Furious](https://media3.giphy.com/media/gdwril4zFP3j8twBmP/giphy.gif?cid=ecf05e47apgxahj8kkdbey5lqu318v6txgrtj64sc2u7t8oh&ep=v1_gifs_search&rid=giphy.gif&ct=g)

Currently the team is operating with less processes, procedures, and tooling that larger organizations might. Currently we are checking directly into `main` without any PRs.

This works well to increase our velocity when we are a small team and tight team but requires trust. We work on the honor system here so while you are free to commit code to `main` please consider these items before you do so:

* Run the tests before checking into `main`
* If you believe the set of changes you have are high risk then quickly ask someone in [Engineering on Slack](https://polyverse.slack.com/archives/C0501S5LWNA) for a live code review
* We typically don't do feature branches here at the moment but if you believe you have a large set of changes that are going to be very disruptive while working on them it might be worth considering (e.g. changing the whole data model)

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

We use [MochaJS](https://mochajs.org/) as a testing framework. To run the tests ensure you have `Sara` running (`pnpm run dev`) and then simply run the following command: `pnpm run test`.

Please run these tests before every commit to `main`.

### How The Tests Work

While we use [MochaJS](https://mochajs.org/) as a testing framework the way we actually run our tests is a little atypical (take a gander at the `test` script in `package.json`). This section provides context to developers as to why they are ran this way.

`Sara` originally started as a fork of a public demonstration of NextJS interfacing with OpenAI. The forked project provided non-insignificant set of TypeScript compiler options (see `tsconfig.json`). The TypeScript compiler options compiles to support [`ECMAScript modules`](https://nodejs.org/api/esm.html) yet `package.json` excludes the `type` field and thus modules are considered [`CommonJS`](https://nodejs.org/api/modules.html#modules-commonjs-modules) by default.

When we added `MochaJS` tests we wished to preserve type checking in the tests with TypeScript. This coupled with NextJS providing its own set of build tools (i.e. `next build`) as well as the differneces in module support between the `tsconfig.json` and `package.json` the current way we believe we can get `MochaJS` tests to work is to compile them first before running them and then "tricking" `Node` into treating the compiled code as [`ECMAScript modules`](https://nodejs.org/api/esm.html). For more details you can review the details of the `test` script in `package.json`.

### Testing With `node-boost-api` Service

The [`node-boost-api`](https://github.com/polyverse-appsec/boost-node-api) project is used to develop an `Express JS` server that is deployed to AWS Lambda. `Sara` communicates with it to provide as well as retrieve info about users projects/repos. Some of this information retrieved is then used to improve the prompts we provide to OpenAI that `Sara` depends on.

The [`node-boost-api`](https://github.com/polyverse-appsec/boost-node-api) also initiates file uploads of a users repo for introspection purposes. At the time of writing (1/13/24) the file upload logic isn't yet implemented but a manual path for initiating the file upload does exist:

* Copy the script located at `scripts/create_project.py` into the root directory of the project/repo you wish to upload for `Sara`
* Ensure you have `blueprint.md` in the root directory where the script is located
* Run the following command:

```
python create_project.py --email [YOUR_GITHUB_EMAIL] --organization [ORGANIZATION_NAME] --github_uri [URI_OF_GITHUB_PROJ] --path_to_summarizer [PATH_TO_SUMMARIZER_SCRIPT]  --project_name [PROJ_NAME]
```

Example usage:

```
python create_project.py --email aaron@polyverse.com --organization polyverse-appsec --github_uri https://github.com/polyverse-appsec/sara --path_to_summarizer ../summarizer/main.py  --project_name sara
```

* Overtime `Sara` ought to be able to make requests to [`node-boost-api`](https://github.com/polyverse-appsec/boost-node-api) to get the file IDs for the uploaded files

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

## Resources

* [NextJS Docs](https://nextjs.org/docs)
* [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
  * [@vercel/kv SDK/API Reference](https://vercel.com/docs/storage/vercel-kv/kv-reference)
* [Redis Docs](https://redis.io/docs/)
* [React Tutorials](https://react.dev/learn)
* [React API Reference](https://react.dev/reference/react)
* [Tailwind CSS Docs](https://tailwindcss.com/docs/installation)
* [MochaJS Docs](https://mochajs.org/)
