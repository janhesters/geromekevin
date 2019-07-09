---
title: How To Use AWS AppSync in Lambda Functions
date: '2019-06-26'
description: Execute queries and mutations by using the correct execution policy and polyfills.
---

In this tutorial, you are going to learn how you can execute queries and mutations in a Lambda function on an AppSync GraphQL API. We are going to use the Amplify framework to generate our code, but the solutions here work whether you use Amplify, or Serverless or something else.

---

Do you even have a backend if you can only modify your database from your client side? There might be operations that you want to prohibit your users from doing. A malicious user might be able to abuse your client-side code. The fix is to have your server manipulate your database, too 👏🏻.

After I read Nader' Dabit's excellent tutorial ["Lambda Function GraphQL Resolvers"](https://dev.to/dabit3/lambda-function-graphql-resolvers-11cd), I wanted to know how I could modify my existing DynamoDB backend from a Lambda function. (Nader only shows how to generate a new database.) When I finally found a solution, I found out that **modifying your DynamoDB directly comes with a significant disadvantage: If you have subscriptions or pipeline resolvers set up for your AppSync API they are ignored**, and you will NOT trigger them. I needed to find a way to use AppSync from Lambda.

This guide covers how you can **access your AppSync API from a Lambda function**. We are going to use Amplify to generate the resources, and we are going to use the AppSync client and console to execute the queries and tweak our schemas. I'll leave your client-side code up to you, and we'll focus on the Amplify, AppSync and Lambda code.

Here is an overview of the steps.

- Create a Lambda function, which uses the AppSync client to perform GraphQL operations. Use polyfills and install all necessary dependencies.
- Ensure the Lambda function has the right execution policy.
- [Use AppSync's multi auth](https://aws.amazon.com/blogs/mobile/using-multiple-authorization-types-with-aws-appsync-graphql-apis/) to allow both requests that are signed by Amazon Cognito User Pools as well as requests that are signed using Amazon's IAM. This way, both the client and the server (aka. the Lambda function) will be authenticated and can have different CRUD permissions.

**Note:** You want to avoid hardcoding user credentials in your Lambda function. It is best practice for a Lambda function to use an IAM policy on its execution role to interact with a destination service, which is why we take the approach described above.

Let's do it 🚀. Start by initializing your Amplify project.

```bash
amplify init
? Enter a name for the project
appsynclambda
? Enter a name for the environment
master
? Choose your default editor:
<your-editor>
? Choose the type of app that you\'re building
javascript
Please tell us about your project
? What javascript framework are you using
react
? Source Directory Path:
src/
? Distribution Directory Path:
build/
? Build Command:
npm run-script build
? Start Command:
npm run-script start
? Do you want to use an AWS profile?
Yes
? Please choose the profile you want to use
<your-profile>
```

The first category we are going to add is authentication.

```bash
amplify add auth
Do you want to use the default authentication and security configuration?
Default configuration
How do you want users to be able to sign in when using your Cognito User Pool?
Email
What attributes are required for signing up? (Press <space> to select, <a> to toggle all, <i> to invert selection)
Email
```

Secondly, we need to add the GraphQL endpoint. This will also generate a DynamoDB for you.

```bash
amplify add api
? Please select from one of the below mentioned services
GraphQL
? Provide API name:
appsyncTodo
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

And here is how you want to edit that schema.

```graphql
type Todo @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  title: String!
  completed: Boolean!
}
```

We create a model for the todos, which will create a DynamoDB table. The owner of the todos has full CRUD permissions for the todos. We'll later modify this in the Amplify console. **Keep in mind: whenever you push changes from Amplify, it will overwrite the work that you did in the console.** Remember to add the necessary directives after each push. If this doesn't make sense to you, keep reading. It will make sense soon. I just wanted to get this in your head as early as possible.

Commit your changes to the cloud.

```bash
amplify push
? Are you sure you want to continue?
Yes
? Do you want to generate code for your newly created GraphQL API
Yes
? Choose the code generation language target
javascript
? Enter the file name pattern of graphql queries, mutations and subscriptions
src/graphql/**/*.js
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions
Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested]
2
```

Now, we want to add the Lambda function.

```bash
amplify add function
Using service: Lambda, provided by: awscloudformation
? Provide a friendly name for your resource to be used as a label for this category in the project:
lambdaTodo
? Provide the AWS Lambda function name:
lambdaTodo
? Choose the function template that you want to use:
Serverless express function (Integration with Amazon API Gateway)
? Do you want to access other resources created in this project from your Lambda function?
Yes
? Select the category
api
? (<Only prompted if>) Api has 2 resources in this project. Select the one you would like your Lambda to access
appsyncTodo
? Select the operations you want to permit for todostreak (Press <space> to select, <a> to toggle all, <i> to invert selection)
create, read, update, delete
? Do you want to edit the local lambda function now?
Yes
```

(If you already have a Lambda function update it using `amplify update function` because the latest version of the CLI will auto-generate the necessary environment variables and policies.) Modify your Lambda function to reflect the following.

```js
/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
const environment = process.env.ENV
const region = process.env.REGION
const apiAppsyncTodoGraphQLAPIIdOutput = process.env.API_APPSYNCTODO_GRAPHQLAPIIDOUTPUT
const apiAppsyncTodoGraphQLAPIEndpointOutput = process.env.API_APPSYNCTODO_GRAPHQLAPIENDPOINTOUTPUT

Amplify Params - DO NOT EDIT */

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk');
const graphqlQuery = require('./graphql.js').query;
const gql = require('graphql-tag');
const AWSAppSyncClient = require('aws-appsync').default;
require('es6-promise').polyfill();
require('isomorphic-fetch');

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const url = process.env.API_APPSYNCTODO_GRAPHQLAPIENDPOINTOUTPUT;
const region = process.env.REGION;

AWS.config.update({
  region,
  credentials: new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
    process.env.AWS_SESSION_TOKEN
  ),
});
const credentials = AWS.config.credentials;

const appsyncClient = new AWSAppSyncClient(
  {
    url,
    region,
    auth: {
      type: 'AWS_IAM',
      credentials,
    },
    disableOffline: true,
  },
  {
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    },
  }
);

const query = gql(graphqlQuery);

app.get('/items', async function(_, res) {
  try {
    const client = await appsyncClient.hydrated();
    const data = await client.query({ query });
    res.json({ success: 'get call succeeded!', data });
  } catch (error) {
    console.log(error);
    res.json({ error: 'get call failed!', error });
  }
});

app.listen(3000, function() {
  console.log('App started');
});

module.exports = app;
```

What we are doing here is first polyfilling `fetch` so that we can use it. ([Lambda functions run in a Node 8.10 environment.](https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/)) Consequently, we configure the [`aws-sdk`](https://github.com/aws/aws-sdk-js) and the [`AWSAppSyncClient`](https://github.com/awslabs/aws-mobile-appsync-sdk-js). Then we execute the query.

Make sure your Lambda function has the [correct permissions](https://docs.aws.amazon.com/appsync/latest/devguide/security.html#aws-iam-authorization).

```json
"AmplifyResourcesPolicy": {
	"DependsOn": [
		"LambdaExecutionRole"
	],
	"Type": "AWS::IAM::Policy",
	"Properties": {
		"PolicyName": "amplify-lambda-execution-policy",
		"Roles": [
			{
				"Ref": "LambdaExecutionRole"
			}
		],
		"PolicyDocument": {
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"appsync:Create*",
						"appsync:StartSchemaCreation",
                        // highlight-start
						"appsync:GraphQL",
                        // highlight-end
						"appsync:Get*",
						"appsync:List*",
						"appsync:Update*",
						"appsync:Delete*"
					],
                    // highlight-start
					"Resource": [
						{
							"Fn::Join": [
								"",
								[
									"arn:aws:appsync:",
									{
										"Ref": "AWS::Region"
									},
									":",
									{
										"Ref": "AWS::AccountId"
									},
									":apis/",
									{
										"Ref": "apiappsyncTodoGraphQLAPIIdOutput"
									},
									"/*"
								]
							]
						}
					]
                // highlight-end
				}
			]
		}
	}
}
```

If your function has the correct permission, [it will automatically have access to the necessary environment variables](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-lambda.html) such as `process.env.AWS_ACCESS_KEY_ID`, `process.env.AWS_SECRET_ACCESS_KEY` and `process.env.AWS_SESSION_TOKEN`.

You will also need to [add some dependencies](https://docs.aws.amazon.com/appsync/latest/devguide/building-a-client-app-node.html) to its `package.json`.

```json
"dependencies": {
  "apollo-cache-inmemory": "^1.1.0",
  "apollo-client": "^2.0.3",
  "apollo-link": "^1.0.3",
  "apollo-link-http": "^1.2.0",
  "aws-appsync": "^1.8.1",
  "aws-sdk": "^2.482.0",
  "aws-serverless-express": "^3.3.5",
  "body-parser": "^1.17.1",
  "es6-promise": "^4.2.8",
  "express": "^4.15.2",
  "graphql": "^0.11.7",
  "graphql-tag": "^2.10.1",
  "isomorphic-fetch": "^2.2.1"
},
```

Or use `npm`.

```bash
npm install --save apollo-cache-inmemory apollo-client apollo-link apollo-link-http aws-appsync aws-sdk aws-sdk es6-promise graphql graphql-tag isomorphic-fetch
```

Remember to run `npm install` from the function's `src` directory if you want to test it locally. Furthermore, you need to create a file at `src/graphql.js` which contains the query.

```js
module.exports = {
  query: `query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        completed
      }
      nextToken
    }
  }
  `,
};
```

Lastly, add the function to a `REST` API.

```bash
amplify add api
? Please select from one of the below mentioned services
REST
? Provide a friendly name for your resource to be used as a label for this category in the project:
lambdaTodo
? Provide a path (e.g., /items)
/items
? Choose a Lambda source
Use a Lambda function already added in the current Amplify project
? Choose the Lambda function to invoke by this path
lambdaTodo
? Restrict API access
Yes
? Who should have access?
Authenticated users only
? What kind of access do you want for Authenticated users?
create
? Do you want to add another path?
No
```

Push your changes. Subsequently, visit your AppSync console, choose your API and click on "Schema". Scroll down until you see your `Query` or `Mutation`. I want to perform the `listTodos` query in Lambda, so I grant access to it using both `@aws_iam` and `@aws_cognito_user_pools`.

```graphql
type Query {
  getTodo(id: ID!): Todo
  listTodos(
    filter: ModelTodoFilterInput
    limit: Int
    nextToken: String
  ): ModelTodoConnection @aws_iam @aws_cognito_user_pools
  getStreak(id: ID!): Streak
  listStreaks(
    filter: ModelStreakFilterInput
    limit: Int
    nextToken: String
  ): ModelStreakConnection
}
```

You can use the [auth directive's](https://aws-amplify.github.io/docs/js/api#aws-appsync-multi-auth-1) on a per field basis like demonstrated above or you can do it on each type to give all its attributes the directives (`type Query @aws_iam @aws_cognito_user_pools {`). `ModelTodoConnection` will also need these permissions because `listTodos` returns it.

```graphql
type ModelTodoConnection @aws_iam @aws_cognito_user_pools {
  items: [Todo]
  nextToken: String
}
```

Remember: what you modify in the console will be overwritten every time you push changes to this API

Hit save, and you are done 🔥. You should now be able to access the function from your client. Here is how you do that using Amplify in JavaScript.

```js
import { API } from 'aws-amplify';

async function lambda() {
  try {
    const res = await API.get('lambdaTodo', '/items');
    console.log(res);
  } catch (error) {
    console.log(error);
  }
}
```

If you set up your schema the same way I did and created some todos, notice how the `items` array that you get back is empty. That's because the todos are filtered in AppSync's `.vtl` template. If you don't know what `.vtl` templates are and how AppSync uses them as resolver templates for your GraphQL requests, you might want to read ["Query More Items Using Scans in AWS Amplify"](https://geromekevin.com/query-all-items-using-scans-in-aws-amplify/) and ["Creating GraphQL Batch Operations for AWS Amplify"](https://geromekevin.com/creating-graphql-batch-operations-for-aws-amplify/). In these two tutorials, I explain what `.vtl` templates are and you are going to learn how you can write your own. Then you should be able to write a custom query and its resolver so that you get some items back.

## Summary

We polyfilled some functions which the AppSync client needs and configured it alongside the `aws-sdk` to perform GraphQL operations from our Lambda function. We ensured the Lambda function has the necessary permissions by tweaking our GraphQL schema.

If you are using Amplify, take a look at [this PR](https://github.com/aws-amplify/amplify-cli/pull/1524). It will bring AppSync's capability to support multiple authorization types to GraphQL transform. If it's already merged check out [my other blog posts](https://geromekevin.com/) because I'll probably have written a guide on how to use that directive.
