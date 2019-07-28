---
title: How to Access the User in Lambda Functions (with Amplify)
date: '2019-07-16'
description: Use a regex with custom middleware.
tags: ['lambda', 'amplify', 'express', 'cognito']
---

In this tutorial, you are going to learn how to get the user who calls the AWS Lambda function. We are going to use function composition for Express middleware to pass the user to all requests.

---

**Note:** This article is a tutorial for intermediates. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? For beginners, I recommend checking out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start) to learn the basics.

A question that I've gotten from my last tutorial on [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) functions ["How To Use AWS AppSync in Lambda Functions"](https://geromekevin.com/how-to-use-aws-appsync-in-lambda-functions/) was: "How can you access the user so you can filter for his items in a query?" We are going to take a look at how you can access the user's ID and the user object using the [AWS SDK for JavaScript](https://github.com/aws/aws-sdk-js). Additionally, you are going to learn how to efficiently compose [Express](https://expressjs.com/de/) middleware to give access to the user in all requests in a [DRY](https://de.wikipedia.org/wiki/Don%E2%80%99t_repeat_yourself) way. This tutorial should work for all Lambda functions where the caller is authenticated using [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html), and we are going to generate our resources using the [Amplify](https://aws-amplify.github.io/) CLI.

## Accessing the User

I assume you have already [set up your Amplify project](https://aws-amplify.github.io/docs/js/start#getting-started) with the auth category and Cognito User Pools.

Create a new Lambda function using Express.

```bash
amplify add function
? Provide a friendly name for your resource to be used as a label for this category in the project:
LambdaUser
? Provide the AWS Lambda function name:
LambdaUser
? Choose the function template that you want to use:
Serverless express function (Integration with Amazon API Gateway)
? Do you want to access other resources created in this project from your Lambdafunction?
 Yes
? Select the category (Press <space> to select, <a> to toggle all, <i> to invertselection)
auth
? Select the operations you want to permit for lambdauser<some_number>
read

You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var authLambdauser<some_number>UserPoolId = process.env.AUTH_LAMBDAUSER<some_number>_USERPOOLID

? Do you want to edit the local lambda function now?
No
```

`cd` into your Lambda function.

```bash
cd amplify/backend/function/LambdaUser/src/
```

Install the AWS SDK.

```js
npm install --save aws-sdk
```

We are going to access the user through the [API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html) object that gets passed to the Lambda function by the [AWS serverless express middleware](https://github.com/awslabs/aws-serverless-express). (Thank you to [Troy](https://twitter.com/troygoode?lang=de) who [came up](https://github.com/aws-amplify/amplify-cli/issues/657#issuecomment-451337547) with this.) If you get an error about CORS when you invoke this function later, make your user is NOT in the state `FORCE_CHANGE_PASSWORD`.

```js
/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
const environment = process.env.ENV
const region = process.env.REGION
const authLambdauser<some_number>UserPoolId = process.env.AUTH_LAMBDAUSERSOMENUMBER_USERPOOLID

Amplify Params - DO NOT EDIT */

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk');

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

app.get('/items', async function(req, res) {
  try {
    const IDP_REGEX = /.*\/.*,(.*)\/(.*):CognitoSignIn:(.*)/;
    const authProvider =
      req.apiGateway.event.requestContext.identity
        .cognitoAuthenticationProvider;
    const [, , , userId] = authProvider.match(IDP_REGEX);

    const cognito = new AWS.CognitoIdentityServiceProvider();
    const listUsersResponse = await cognito
      .listUsers({
        UserPoolId: process.env.AUTH_LAMBDAUSERSOMENUMBER_USERPOOLID,
        Filter: `sub = "${userId}"`,
        Limit: 1,
      })
      .promise();
    const user = listUsersResponse.Users[0];
    res.json({ user, message: 'get call succeed!', url: req.url });
  } catch (error) {
    console.log(error);
    res.json({ error, message: 'get call failed' });
  }
});

app.listen(3000, function() {
  console.log('App started');
});

module.exports = app;
```

Let's go over this code. To make the example more concise, we deleted all routes, but the `get` route for `/items` and got rid of all comments. We extract the user's ID using a regex from them API gateway data that the AWS serverless express middleware injects. Afterwards, we configure the AWS SDK to communicate with our Cognito User Pool. Lastly, we call [`listUsers`](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_ListUsers.html) and pick our user.

We also need to add this function to our API category.

```bash
amplify add api
? Please select from one of the below mentioned services
REST
? Provide a friendly name for your resource to be used as a label for this category in the project:
LambdaUser
? Provide a path (e.g., /items)
/items
? Choose a Lambda source
Use a Lambda function already added in the current Amplify project
? Choose the Lambda function to invoke by this path
LambdaUser
? Restrict API access
Yes
? Who should have access?
Authenticated users only
? What kind of access do you want for Authenticated users? (Press <space> to select, <a> to toggle all, <i> to invert selection)
create, read, update, delete
? Do you want to add another path?
No
```

Push your changes.

```bash
amplify push
```

If you are using React you can use the following `useEffect` Hook to try out the function after you ran `Amplify.configure(config)`;

```js
useEffect(() => {
  async function fetch() {
    try {
      await Auth.signIn('user@tutorial.com', 'password');
      const res = await API.get('LambdaUser', '/items');
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }

  fetch();
});
```

It works! 🎉 But, notice how much boilerplate it is to get and inject the user into our route. If you have many routes where you want to access the user, it would be cool if we could find a beautiful abstraction 🤔.

## Middleware

Let's clean up a bit. We are going to move the user injection logic into a separate middleware. Create `middleware.js` in your Lambda function's directory. If the following code intimidates you, relax. We'll go through it.

```js
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk');

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);
const tapRoute = f => route => {
  route.use(f);
  return route;
};

const configureCors = route => {
  route.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });
  return route;
};

const injectUser = route => {
  route.use(async function(req, res, next) {
    try {
      const IDP_REGEX = /.*\/.*,(.*)\/(.*):CognitoSignIn:(.*)/;
      const authProvider =
        req.apiGateway.event.requestContext.identity
          .cognitoAuthenticationProvider;
      const [, , , userId] = authProvider.match(IDP_REGEX);

      const cognito = new AWS.CognitoIdentityServiceProvider();
      const listUsersResponse = await cognito
        .listUsers({
          UserPoolId: process.env.AUTH_LAMBDAUSERB2E6BC69_USERPOOLID,
          Filter: `sub = "${userId}"`,
          Limit: 1,
        })
        .promise();
      const user = listUsersResponse.Users[0];
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  return route;
};

const applyMiddleware = (route, ...middleware) =>
  pipe(
    tapRoute(bodyParser.json()),
    tapRoute(awsServerlessExpressMiddleware.eventContext()),
    configureCors,
    injectUser,
    ...middleware
  )(route);

module.exports = {
  applyMiddleware,
};
```

After importing the packages we need, we define `pipe`. `pipe` lets us functionally [compose](https://medium.com/javascript-scene/curry-and-function-composition-2c208d774983) the middleware. Afterwards, we define `tapRoute`, which takes in a function and `route` (aka. `app` from `app.js`), calls the function with it and returns `route`. We need `tapRoute` for the middleware that we didn't write ourselves so we can keep the data flowing through our `pipe`. Next, we define `configureCors` and `injectUser`. The former is the `tapRoute` logic bundled with the [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) settings that come when you create a Lambda function with Amplify. The ladder is a middleware that gets the user like we did in the previous section and puts it onto the `req` object. Lastly, we define `applyMiddleware`, which takes in `route` and optionally more middleware and composes all the middleware into one function.

Here is how `app.js` looks using `applyMiddleware`.

```js
const express = require('express');
const applyMiddleware = require('./middleware').applyMiddleware;

const app = express();
applyMiddleware(app);

app.get('/items', function(req, res) {
  res.json({
    user: req.user,
    message: 'get call succeed!',
    url: req.url,
  });
});

app.listen(3000, function() {
  console.log('App started');
});

module.exports = app;
```

Wow, that looks a lot cleaner. Notice how we pass `app` to `applyMiddleware`. We call it `route` in the definition of `applyMiddleware` because you could also alter the function using the optional second `...middleware` argument on a per route basis.

Push your changes to the cloud. The function should still work the same as before. However, `app.js` looks cleaner, we can easily add more middleware using `applyMiddleware`, and all middleware logic is bundled to one file.

If you followed this tutorial, you can run `amplify delete` to remove all resources in the cloud.

## Summary

We learned how we can extract the user using the API gateway object that gets injected from the AWS serverless express middleware. Moreover, we refactored the user injection logic into a custom middleware, reducing the amount of boilerplate we have to write. And we learned how we can use function composition to tidy up our middleware and make our code more readable.
