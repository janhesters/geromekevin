---
title: Multiple Environments with AWS Amplify
date: '2019-08-13'
description: Treat the environments like Git.
tags: ['amplify', 'env']
---

In this tutorial, you are going to learn **how to use Amplify's `env` command**. We will walk through an example where two people collaborate on an Amplify project.

---

**Note:** This article is a tutorial for intermediate developers who are familiar with the basics of Amplify. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? I recommend beginners to check out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start).

If you use Amplify in your team, you will have to know how to use [the `env` command](https://aws-amplify.github.io/docs/cli-toolchain/quickstart#environments--teams) properly. Otherwise, your collaboration will be a mess. Done right, Amplify allows easy and effective collaboration on projects.

There are two ways you can share an Amplify project.

1. Each team member works **in their own "sandbox"** aka. their local version of the environment.
2. The team **shares the same development environment.**

The first approach is recommended. Let's walk through each procedure, so you understand both and can decide which you prefer. You need to be [familiar with Git](https://egghead.io/courses/practical-git-for-everyday-professional-use) to follow this tutorial.

## 1. Sandboxes

We start with the sandbox approach. Create a folder for this tutorial called `multiple-env/`.

```bash
mkdir multiple-env && cd multiple-env
```

Initialize the React project.

```bash
npx create-react-app env-one && cd env-one
```

[Create React App](https://github.com/facebook/create-react-app) automatically initializes a Git repository for us. The folder layout should _later_ look like this.

```bash
└──multiple-env/
   ├── env-one/
   └── env-two/
```

Imagine `env-two/` being on your co-worker's computer. Here we'll use the two apps on your computer to simulate multiple environments.

### 1. a) You

Initialize amplify in your first environment and add authentication. **Note:** In some of these code examples, there will be _several CLI commands_ that you have to run. Remember to **_double-check that you catch all_** and don't miss any.

```bash
# highlight-start
amplify init
# highlight-end
Note: It is recommended to run this command from the root of your app directory
? Enter a name for the project
env-one
# highlight-start
? Enter a name for the environment
prod
# highlight-end
? Choose your default editor:
Visual Studio Code
? Choose the type of app that you\'re building
javascript
Please tell us about your project
? What javascript framework are you using
react
? Source Directory Path:
src
? Distribution Directory Path:
build
? Build Command:
npm run-script build
? Start Command:
npm run-script start
Using default provider  awscloudformation

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

? Do you want to use an AWS profile?
Yes
? Please choose the profile you want to use
your-amplify-cli-user

✔ Successfully created initial AWS cloud resources for deployments.
✔ Initialized provider successfully.
Initialized your environment successfully.

Your project has been successfully initialized and connected to the cloud!

# highlight-start
amplify add auth
# highlight-end
Do you want to use the default authentication and security configuration?
Default configuration
Warning: you will not be able to edit these selections.
How do you want users to be able to sign in?
Email
Do you want to configure advanced settings?
No, I am done.
```

Nothing fancy going on here. Just make sure to name the first environment `prod`, `master` or something along those lines.

Push your changes to the cloud.

```bash
amplify push
```

If you run `amplify status`, you will see that your changes have been deployed.

```bash
amplify status

Current Environment: prod

| Category | Resource name  | Operation | Provider plugin   |
| -------- | -------------- | --------- | ----------------- |
| Auth     | envoneauth | No Change | awscloudformation |
```

Add the changes to git.

```bash
git add --all && git commit -m "Initialize Amplify and add authentication."
```

Set up a remote repository on GitHub or your version control provider of choice and upload your files.

```bash
git remote add origin https://github.com/janhesters/envtutorial.git
git push -u origin master
```

### 1. b) Your Co-Worker

You might want to use a second editor and terminal window to simulate the collaboration.

Clone the remote repository.

```bash
git clone https://github.com/janhesters/envtutorial.git env-two && cd env-two && yarn
```

If you run `amplify status` now, it will throw an error.

```bash
amplify status

Current Environment: undefined
```

Initialize the `master` branch using the `prod` environment.

```bash
amplify init
Note: It is recommended to run this command from the root of your app directory
? Do you want to use an existing environment?
Yes
? Choose the environment you would like to use:
prod
? Choose your default editor:
Visual Studio Code
Using default provider  awscloudformation

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

? Do you want to use an AWS profile?
Yes
? Please choose the profile you want to use
your-amplify-cli-user

✔ Initialized provider successfully.
Initialized your environment successfully.

Your project has been successfully initialized and connected to the cloud!
```

In a real-world scenario, your collaborators might have different CLI profiles. Make sure everyone has the permissions to access the relevant resources.

Now, your co-worker has the environment, too.

```bash
amplify status

Current Environment: prod

| Category | Resource name | Operation | Provider plugin   |
| -------- | ------------- | --------- | ----------------- |
| Auth     | envoneauth    | No Change | awscloudformation |
```

### 1. c) You

Change back to `env-one/`. We want to add another feature.

**Amplify environments work [hand in hand](https://aws-amplify.github.io/docs/cli-toolchain/quickstart#quick-tips) with Git.** We can create our sandbox by creating a new git branch, and running `amplify init` within it.

```bash
git checkout -b sandbox && amplify init
Switched to a new branch 'sandbox'
Note: It is recommended to run this command from the root of your app directory
? Do you want to use an existing environment?
No
? Enter a name for the environment
sandbox
Using default provider awscloudformation

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

? Do you want to use an AWS profile?
Yes
? Please choose the profile you want to use
your-amplify-cli-user
```

Typically, you would give the branch a more meaningful name than `"sandbox"`. Alternatively to `amplify init` we could've also used `amplify env add`.

The changes for this environment aren't deployed yet.

```bash
amplify status

Current Environment: sandboxone

| Category | Resource name | Operation | Provider plugin   |
| -------- | ------------- | --------- | ----------------- |
| Auth     | envonesandbox | Create    | awscloudformation
```

Note how it says our current environment is `sandboxone`. To list all environments run `amplify env list`.

```bash
amplify env list

| Environments |
| ------------ |
| prod         |
| *sandboxone  |
```

In this list, our current environment is marked with a star (`*`).

Let's also add an API to the sandbox and deploy it.

```bash
# highlight-start
amplify add api
# highlight-end
? Please select from one of the below mentioned services
GraphQL
? Provide API name:
AppSyncEnvOneSandbox
? Choose an authorization type for the API
Amazon Cognito User Pool
Use a Cognito user pool configured as a part of this project
? Do you have an annotated GraphQL schema?
No
? Do you want a guided schema creation?
Yes
? What best describes your project:
Single object with fields (e.g., “Todo” with ID, name, description)
? Do you want to edit the schema now?
No

# highlight-start
amplify push
git add --all && git commit -m "Add API."
# highlight-end
```

The sandbox now has an API as well as authentication. If we made our changes and want to merge them into the production environment, we can do that by using Git.

```bash
git checkout master
amplify env checkout prod
git merge sandbox
amplify push
git add --all && git commit -m "Merge API into production."
```

If you are done using your sandbox environment, you can delete it by running `amplify env remove`.

```bash
amplify env remove sandbox
? Do you also want to remove all the resources of the environment from the cloud?
Yes
```

### 1. d) Your Co-Worker

Your co-worker can get the changes by running `amplify env pull`. `cd` into `env-two/` and do that.

```bash
git pull && amplify env pull
```

When those commands are done your co-worker is synced up with the master branch.

```bash
amplify status

Current Environment: prod

| Category | Resource name        | Operation | Provider plugin   |
| -------- | -------------------- | --------- | ----------------- |
| Auth     | envoneauth           | No Change | awscloudformation |
| Api      | AppSyncEnvOneSandbox | No Change | awscloudformation |
```

Good job! 👏🏻 Now you know how to collaborate using sandboxes. Next, we'll explore collaboration with ...

## 2. Sharing backends

Sharing backends is as easy as using the sandbox. [I like to mix both approaches.](https://aws-amplify.github.io/docs/cli-toolchain/quickstart#team-members-working-on-their-own-sandbox-environments-recommended) Meaning each team member develops using their custom sandbox, but before changes get merged into production, they get merged into the development environment.

### 2. a) You

Similar to the sandbox approach, create a `dev` branch with Git and an environment with Amplify in `env-one/`.

```bash
git checkout -b dev && amplify init
Switched to a new branch 'dev'
Note: It is recommended to run this command from the root of your app directory
? Do you want to use an existing environment?
No
? Enter a name for the environment
dev
Using default provider  awscloudformation

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

? Do you want to use an AWS profile?
Yes
? Please choose the profile you want to use
your-amplify-cli-user
```

We might want to [track our users using Amplify's analytics](https://janhesters.com/tracking-and-email-reminders-in-aws-amplify/), so let's add that to our `dev` branch.

```bash
amplify add analytics
Using service: Pinpoint, provided by: awscloudformation
? Provide your pinpoint resource name:
AnaliticsDev
Adding analytics would add the Auth category to the project if not already added.
? Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)
No
Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.
Successfully updated auth resource locally.
Successfully added resource AnaliticsDev locally
```

Push your changes to the cloud and GitHub.

```bash
amplify push
git add --all && git commit -m "Add analytics."
git push --set-upstream origin dev
```

## 2. b) You Co-Worker

Your co-worker, in `env-two/`, can get the remote branch by creating his local version and then fetching it.

```bash
git checkout -b dev && git fetch origin dev && git pull origin dev
```

Your co-worker can list all environments to see both the prod and the dev branch.

```bash
amplify env list

| Environments |
| ------------ |
| *prod        |
| dev          |
```

Moving code from `dev` to `prod` works the same way as we showed earlier when we moved from `sandbox` to `prod`.

If you liked this tutorial, you might want to read [my other articles about Amplify](https://janhesters.com/tags/amplify/) because they cover advanced use cases and make you an Amplify expert.

## Summary

_**Remember:** Use Amplify's `env` command **parallel** to Git._

We understood the two ways - sandbox and shared environments - to use `env` by looking at an example for each.

To clean up run `amplify delete`.
