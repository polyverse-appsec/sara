# Sara

- [Sara](#Sara)
  - [Quickstart](#Quickstart)
  - [Design & Technical Docs](#Design--Technical-Docs)
  - [Development](#Development)
    - [Running Locally (First Time Usage)](#Running-Locally-First-Time-Usage)
    - [Running With DB Containers (Docker)](#Running-With-DB-Containers-Docker)
    - [Debugging The Frontend](#Debugging-The-Frontend)
    - [Debugging The Backend](#Debugging-The-Backend)
    - [Committing Code](#Committing-Code)
      - [Make It Pretty :sparkles:](#Make-It-Pretty-sparkles)
  - [Testing](#Testing)
    - [How The Tests Work](#How-The-Tests-Work)
    - [Testing With `node-boost-api` Service](#Testing-With-node-boost-api-Service)
  - [Ops](#Ops)
    - [Adding/Updating Deployment Environment Variables](#AddingUpdating-Deployment-Environment-Variables)
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

## Development

### Running Locally (First Time Usage)

The following steps will setup your environment with Vercel Environment Variables so you can run it locally:

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`
4. Install dependencies: `pnpm install`
5. Run local development instance: `pnpm run dev`

Your app template should now be running on [localhost:3000](http://localhost:3000/).

### Running With DB Containers (Docker)

If you would like to run against a local instance of Redis for testing/development purposes you can use the Docker Compose file to do so. To do so simply run `pnpm run dev-docker`. This will start the Docker Compose deployment in the background as well as start the `Sara` development server with configuration allowing `Sara` to communicate with the local Redis containers.

### Debugging The Frontend

We use `Chrome's Developer Tools` to debug the frontend. To start debugging the frontend start the development environment for `Sara` with the following command: `pnpm run dev`.

Once the development environment is running you can open Chrome's Developer Tools (Ctrl+Shift+J on Windows/Linux, ⌥+⌘+I on macOS). Once open navigate to the `Sources` tab. You can now add debugger statements/breakpoints to stop execution and pause on the relevaant file you are trying to debug. To search for the file you wish to debug in Chrome's Developer Tools Ctrl+P on Windows and ⌘+P on macOS.

### Debugging The Backend

Presently we use `Chrome's Developer Tools` to debug the backend. To start debugging the backend start the development environment for `Sara` with the following command: `pnpm run dev`. Note that the `dev` recipe in `package.json` must have the option `NODE_OPTIONS='--inspect'` set for NodeJS to open up a port a debugger can be attached to. Additionally the `--turbo` option can't be used or else you won't be able to properly attach.

Once running open the inspection tools within Chrome's Developer Tools by navigating to `chrome://inspect` in your browser. Once the inspection tools open click the `Devices` tab on the left and then the `Configure...` button. In the new window add the host and port for which a port was opened for on the NextJS application. The console output of the backend starting will identify for you which port to use. For example see the following console output:

```
➜ sara (main) ✗ pnpm run dev

> polyverse-sara-web-ui@0.3.0 dev /Users/gine/workspace/sara
> NODE_OPTIONS='--inspect' next dev

Debugger listening on ws://127.0.0.1:9229/45e0d70d-2d6b-4a39-896d-48637dc39552
For help, see: https://nodejs.org/en/docs/inspector
Debugger listening on ws://127.0.0.1:9230/fd2cff6a-8c99-4429-878a-2f5904817747
For help, see: https://nodejs.org/en/docs/inspector
   the --inspect option was detected, the Next.js router server should be inspected at port 9230.
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   - Environments: .env.local
```

Once you configure the host and port for which to inspect a new target for you to inspect ought to be shown under `Remote Targets`. You can start inspecting that target and a new debugging console will open for you.

### Committing Code

![We Be 2 Fast 2 Furious](https://media3.giphy.com/media/gdwril4zFP3j8twBmP/giphy.gif?cid=ecf05e47apgxahj8kkdbey5lqu318v6txgrtj64sc2u7t8oh&ep=v1_gifs_search&rid=giphy.gif&ct=g)

Currently the team is operating with less processes, procedures, and tooling that larger organizations might. Currently we are checking directly into `main` without any PRs.

This works well to increase our velocity when we are a small team and tight team but requires trust. We work on the honor system here so while you are free to commit code to `main` please consider these items before you do so:

* Run the tests before checking into `main`
* If you believe the set of changes you have are high risk then quickly ask someone in [Engineering on Slack](https://polyverse.slack.com/archives/C0501S5LWNA) for a live code review
* We typically don't do feature branches here at the moment but if you believe you have a large set of changes that are going to be very disruptive while working on them it might be worth considering (e.g. changing the whole data model)

#### Make It Pretty :sparkles:

![It's Beautiful!](https://media.giphy.com/media/aiRT8aKAZXHWh78TY6/giphy.gif)

Prior to checking in your code run the following command: `pnpm run format:write`. This will run `Prettier` on the code and auto-format it according to the rules defined in `prettier.config.cjs`. Note that it will format all of the code in the codebase - not just the code you touched recently.

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

* Navigate to the `scripts` directory and install any required Python dependencies: `pip install -r requirements.txt`
* Copy the script located at `scripts/create_project.py` into the root directory of the project/repo you wish to upload for `Sara`
* The script as of writing (1/18/24) creates a project using the specified parameters, starts file generators that generates and uploads projectsource, aispec, and blueprint files of the project/repo, and uploads those files to
openAI, it prints out the file IDs that have been stored in openAI's vector store.
* Run the following command:

```
python create_project.py --email [YOUR_GITHUB_EMAIL] --organization [ORGANIZATION_NAME] --github_uri [URI_OF_GITHUB_PROJ] --project_name [PROJ_NAME]
```

Example usage:

```
python create_project.py --email aaron@polyverse.com --organization polyverse-appsec --github_uri https://www.github.com/polyverse-appsec/sara --project_name sara
```

* Overtime `Sara` ought to be able to make requests to [`node-boost-api`](https://github.com/polyverse-appsec/boost-node-api) to get the file IDs for the uploaded files

## Ops

### Adding/Updating Deployment Environment Variables

Vercel allows for the management of [environment variables from the cloud](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variables-on-vercel). When you need to add or update environment variables for the Vercel deployments do so through the configuration/settings for a `Deployment.` After doing so announce to others that the environment variables have been updated and that they need to update their own local environment variables by running `vercel env pull`.

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
