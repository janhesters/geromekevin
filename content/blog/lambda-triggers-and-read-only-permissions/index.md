---
title: Lambda Triggers & Read-Only Permissions with AWS Amplify
date: '2019-08-06'
description: Add the users to static groups using your Lambda triggers.
tags: ['amplify', 'cognito', 'lambda', 'graphql', 'appsync']
---

In this tutorial, you are going to learn how you can trigger a Lambda function on authentication events with AWS Amplify. We are going to add users to a group to make specific data read-only for everyone but its owner.

---

**Note:** This article is a tutorial for intermediate developers who are familiar with the basics of Amplify. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? I recommend beginners to check out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start).

An everyday use case for data is that some data is read-only, and other is not. [Currently](https://github.com/aws-amplify/amplify-cli/issues/1277), the only way- Amplify lets you declare different permissions for users is by [using static groups](https://aws-amplify.github.io/docs/cli-toolchain/graphql#usage-1) in Cognito and using attributes on the schema. We are going to leverage [Amplify's new support for Lambda triggers](https://aws.amazon.com/blogs/mobile/amplify-framework-adds-supports-for-aws-lambda-triggers-in-auth-and-storage-categories/) to add users to a static group upon sign up.

Let's go! 👨🏻‍💻 I'm going to assume you have a new project ready created with `amplify init`.

Start by adding authentication to it. (Make sure you have the latest version of the CLI installed! 👉🏻 `npm install -g @aws-amplify/cli`)

```bash
amplify add auth
Using service: Cognito, provided by: awscloudformation

 The current configured provider is Amazon Cognito.

? Do you want to use the default authentication and security configuration?
Manual configuration
? Select the authentication/authorization services that you want to use:
User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more)
? Please provide a friendly name for your resource that will be used to label this category in the project:
authtrigger
? Please enter a name for your identity pool.
triggeridentitypool
? Allow unauthenticated logins? (Provides scoped down permissions that you can control via AWS IAM)
No
? Do you want to enable 3rd party authentication providers in your identity pool?
No
? Please provide a name for your user pool:
triggeruserpool
Warning: you will not be able to edit these selections.
? How do you want users to be able to sign in?
Email and Phone Number
? Multifactor authentication (MFA) user login options:
OFF
? Email based user registration/forgot password:
Enabled (Requires per-user email entry at registration)
? Please specify an email verification subject:
Your verification code
? Please specify an email verification message:
Your verification code is {####}
? Do you want to override the default password policy for this User Pool?
No
Warning: you will not be able to edit these selections.
? What attributes are required for signing up? (Press <space> to select, <a> to toggle all, <i> to invert selection)
Email
? Specify the app\'s refresh token expiration period (in days):
30
? Do you want to specify the user attributes this app can read and write?
No
# highlight-start
? Do you want to enable any of the following capabilities?
Add User to Group
? Do you want to use an OAuth flow?
No
? Do you want to configure Lambda Triggers for Cognito?
Yes
? Which triggers do you want to enable for Cognito (Press <space> to select, <a> to toggle all, <i> to invert selection)
Post Confirmation
? What functionality do you want to use for Post Confirmation (Press <space> to select, <a> to toggle all, <i> to invert selection)
Add User To Group
? Enter the name of the group to which users will be added.
everyone
Succesfully added the Lambda function locally
? Do you want to edit your add-to-group function now?
No
Successfully added resource authtrigger locally
# highlight-end
```

The steps are pretty self-explanatory. We define a Lambda function that triggers after a user confirms her/his sign-up and add the user to the `everyone` group.

Next, add an API.

```bash
amplify add api
? Please select from one of the below mentioned services
GraphQL
? Provide API name:
AppSyncTrigger
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
Yes
```

Here is how the schema should look like.

```graphql
type Todo
  @model
  @auth(
    rules: [
      { allow: owner }
      { allow: groups, groups: ["everyone"], operations: [read] }
    ]
  ) {
  id: ID!
  name: String!
  owner: String
}
```

Since we didn't specify any `operations` for the owner, he is free to execute any query or mutation on the todos he owns. Every other user is only able to use the `get` and `list` queries on his todos. The available values for the `operations` key besides `read` are `create`, `delete` and `update`. Additionally, we add an optional `owner` attribute to the todo schema because we use it to verify that we are only allowed to read other users' todos. If you make it mandatory by adding a `!` you will have to specify the `owner` manually when you create the todo. Leaving out the `!` allows amplify to populate that field for you automatically.

Push your changes.

```bash
amplify push
```

Now, create two users and add a couple of todos for each of them. You don't have to do that through your code. If you are coding along and want to save time, you can use the Cognito console to create the users and the AppSync console to execute the GraphQL operations. Remember when using the console to add users, the function will NOT be triggered. You will have to add the user to the `"everyone"` group manually.

```graphql
mutation create {
  createTodo(input: { title: "Buy groceries" }) {
    id
    title
    owner
  }
}
```

If you list the todos, you should see the todos of all users.

```graphql
query list {
  listTodos {
    items {
      id
      title
      owner
    }
  }
}
```

But if you try to mutate a todo that is not your own, you should get an error.

```graphql
mutation update {
  updateTodo(
    input: { id: "id-of-other-users-todo", title: "different title" }
  ) {
    id
    title
    owner
  }
}
```

The error looks something like this.

```json
{
  "data": {
    "updateTodo": null
  },
  "errors": [
    {
      "path": ["updateTodo"],
      "data": {
        "id": "09e9963f-bed8-432c-b55c-8eb798c50967",
        "name": "Foo",
        "owner": "eb8a7fa3-463f-4117-aca2-165419cff879"
      },
      "errorType": "DynamoDB:ConditionalCheckFailedException",
      "errorInfo": null,
      "locations": [
        {
          "line": 38,
          "column": 3,
          "sourceName": null
        }
      ],
      "message": "The conditional request failed (Service: AmazonDynamoDBv2; Status Code: 400; Error Code: ConditionalCheckFailedException; Request ID: RO6DBNS6K8D7611RSL9HVRTSUVVV4KQNSO5AEMVJF66Q9ASUAAJG)"
    }
  ]
}
```

Very good! 🤓 We implemented read-only permissions, and our users get added to a static Cognito group using Lambda triggers.
