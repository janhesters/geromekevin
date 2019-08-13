---
title: Testing Lambda Functions (feat. Amplify)
date: '2019-07-30'
description: Isolate logic, then use RITEway for unit tests and Supertest for integration tests.
tags:
  [
    'amplify',
    'lambda',
    'riteway',
    'supertest',
    'testing',
    'unit-testing',
    'integration-testing',
    'functional-testing',
    'express',
  ]
---

You are going to learn how to write unit tests for Lambda functions. We are going to write integration tests, too, and use test-driven development to write our tests. We will break our express app into small modules to make its units composable and testable.

---

**Note:** This article is a tutorial for intermediate developers who are familiar with the basics of Amplify or Lambda functions. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? I recommend beginners to check out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start).

I saw Lambda functions without tests and spaghetti code. In fact, I'm guilty of having written several of those myself. It's part of the learning process as a developer to get better and write cleaner and more maintainable code as you gain experience.

You are going to learn the techniques I use to test and simplify Lambda functions. Simplifying means to isolate your program logic into separate, functional units, which makes it more composable and testable. We are going to use [RITEway](https://github.com/ericelliott/riteway) for unit tests, [Supertest](https://github.com/visionmedia/supertest) for integration tests and [AWS Amplify](https://aws-amplify.github.io/docs/js/start) to generate our Lambda functions.

Why these three tools? RITEway has a genius API that forces your tests to answer [the five questions every unit test must answer](https://medium.com/javascript-scene/what-every-unit-test-needs-f6cd34d9836d). Supertest makes HTTP assertions in Node.js easy. And if you read this article, I won't have to tell you how amazing Amplify is to manage AWS resources. Just [check out the other articles of my blog](https://janhesters.com).

## Unit Tests

I assume you have a project with Amplify initialized ready. Create a new Lambda function using Amplify.

```bash
amplify add function
? Provide a friendly name for your resource to be used as a label for this category in the project:
lambdaTest
? Provide the AWS Lambda function name:
lambdaTest
? Choose the function template that you want to use:
Serverless express function (Integration with Amazon API Gateway)
? Do you want to access other resources created in this project from your Lambda function?
Yes
? Select the category (Press <space> to select, <a> to toggle all, <i> to invert selection)

You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION

? Do you want to edit the local lambda function now?
No
```

Consequently, add RITEway and Supertest alongside [tap-color](https://www.npmjs.com/package/tap-color). The ladder is for formatting our test output so that it looks pretty.

```bash
cd amplify/backend/function/lambdaTest/src/ && npm install --save-dev riteway tap-color supertest && npm i
```

Make sure to add a testing script to your `package.json`.

```json
"test": "riteway '**/*.test.js' | tap-color"
```

We will need some functional programming helpers to compose our code. Either install a functional library like [Ramda](https://ramdajs.com/) or create a file `src/fp/index.js` and add the following functions.

**Note:** If the following functions scare you, level up by reading ["Professor Frisby's Mostly Adequate Guide to Functional Programming"](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/). I also explain the basics of currying in ["Understanding Arrow Functions"](https://janhesters.com/understanding-arrow-functions/). Nevertheless, for the sake of this tutorial, it's okay if you don't get all of this article's code. Understanding the techniques is more important than the actual implementation.

```js
const asyncPipe = (...fns) => x =>
  fns.reduce(async (y, f) => f(await y), x);
const curry = (f, arr = []) => (...args) =>
  (a => (a.length >= f.length ? f(...a) : curry(f, a)))([
    ...arr,
    ...args,
  ]);
const map = curry((fn, arr) => arr.map(fn));
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);
const prop = curry((key, obj) => obj[key]);

const pluck = pipe(
  prop,
  map
);

const tap = f => x => {
  f(x);
  return x;
};
// Use trace to debug your pipes
const trace = msg => tap(x => console.log(msg, x));

module.exports = { asyncPipe, curry, pipe, pluck, prop, tap, trace };
```

I'm going to use Ramda. With the help of `tap` and `pipe`, we can write `applyMiddleware` in `src/middleware/index.js`, which lets us elegantly compose our middleware.

```js
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const bodyParser = require('body-parser');
const R = require('ramda'); // Or const { pipe, tap } = require('../fp');

const tapRoute = f => R.tap(route => route.use(f));

const configureCORS = tapRoute(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const applyMiddleware = (route, ...middleware) =>
  R.pipe(
    tapRoute(bodyParser.json()),
    tapRoute(awsServerlessExpressMiddleware.eventContext()),
    configureCORS
  )(route);

module.exports = { applyMiddleware };
```

**Note:** If you want to learn how you can functionally write your own custom middleware, you might want to read last weeks article ["How to Access the User in Lambda Functions (with Amplify)"](https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/).

Using our test frameworks, we want to write some unit tests in `src/routes/routes.test.js`. We will write one for our `"/items"` GET route and one for the listener that logs out on which port the server is running on.

```js
const { describe } = require('riteway');

const { handleListen, getItems } = require('.');

describe('handleListen()', async assert => {
  const expected = 'Listening on port 8000.';

  assert({
    given: `a port of 8000 and a log() function`,
    should: `call log() with '${expected}'`,
    actual: handleListen(8000, x => x),
    expected,
  });
});

describe('getItems()', async assert => {
  const items = ['foo', 'bar', 'baz'];
  const res = { json: x => x };

  assert({
    given: `some items, a response and a request object`,
    should: `return call .json() with a success message and the items`,
    actual: getItems(items, {}, res),
    expected: { success: 'get call succeeded', items },
  });
});
```

In true TDD fashion, we have to watch the tests fail. Write some dummy functions in `src/routes/index.js`.

```js
const R = require('ramda');

const handleListen = R.curry((port, log) => {});

const getItems = R.curry((items, req, res) => {});

module.exports = { handleListen, getItems };
```

Watch the tests fail by running `npm test`. Afterwards, make the tests pass.

```js
const R = require('ramda');

const handleListen = R.curry((port, log) =>
  log(`Listening on port ${port}.`)
);

const getItems = R.curry((items, req, res) =>
  res.json({ success: 'get call succeeded', items })
);

module.exports = { handleListen, getItems };
```

Now we can use them in our function. Note how we also deleted the comments and routes generated by Amplify.

```js
/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION

Amplify Params - DO NOT EDIT */

const express = require('express');
const { applyMiddleware } = require('./middleware');
const { handleListen, getItems } = require('./routes');

const port = 3000;
const app = express();
applyMiddleware(app);

app.get('/items', getItems(['vacuum cleaner', 'knife', 'computer']));

app.listen(port, handleListen(port, console.log));

module.exports = app;
```

I love how clean this code is 👌🏻. You can locally run your Express server by invoking the Lambda function. But before that, we need to modify `src/event.json` to ping the `/items` route with a GET request.

```json
{
  "httpMethod": "GET",
  "path": "/items"
}
```

Moreover, you can pass keys like `"query"` to simulate URLs with `"?"` in them and `"body"` or `"headers"`.

Now invoke the function.

```bash
amplify function invoke lambdaTest
Using service: Lambda, provided by: awscloudformation
? Provide the name of the script file that contains your handler function:
index.js
? Provide the name of the handler function to invoke:
handler

Running "lambda_invoke:default" (lambda_invoke) task

Listening on port 3000.
EVENT: {"httpMethod":"GET","path":"/items"}

Success!  Message:
------------------
{
    body: "{\"success\":\"get call succeeded\",\"items\":[\"vacuum cleaner\",\"knife\",\"computer\"]}",
    headers: {
        "access-control-allow-headers": "Origin, X-Requested-With, Content-Type, Accept",
        "access-control-allow-origin": "*",
        connection: "close",
        "content-length": "78",
        "content-type": "application/json; charset=utf-8",
        date: "Sat, 13 Jul 2019 21:29:34 GMT",
        etag: "W/\"4e-XNTYS3kI7G7czAiqg07A+69mhoQ\"",
        "x-powered-by": "Express"
    },
    isBase64Encoded: false,
    statusCode: 200
}
```

We won't use these manual tests for the rest of the article. I just wanted to show them to you as another option to try out your functions on the fly. Sometimes you want to do that. However, it's usually better to have your tests automatically confirm that your code works instead of you doing it manually. Let's do that using ...

## Integration Tests

Testing Lambda functions involves I/O. We mocked `res` in our unit test for `getItems`, but generally, you want to avoid mocking because it is a code smell. While I'm going to explain how and why I test what I test, you should read ["Mocking Is a Code Smell"](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a) by Eric Elliott because he explains testing asynchronous code in more detail.

Let's rewrite `"/items"` to be `"/addresses"` which gets a list of users and returns their addresses. We are going to use the free [JSONPlaceholder](https://jsonplaceholder.typicode.com/) API for this.

To force us to write modular code, we want to write the GET route for `/addresses` using `asyncPipe`. A pipe always expects the data types to line up. The function that is passed to the route gets two arguments: `request` and `response`. We will lift them into a generic object context via a function we call `liftReqRes`. Using an object has the advantage that we can pass values through the pipe by attaching them to keys. If you don't understand this yet, wait until you see the code. The code will clear things up for you.

We start with the functional test using Supertest in `src/app.test.js`.

```js
const { describe } = require('riteway');
const request = require('supertest');

const app = require('./app');

describe('/addresses', async assert => {
  const res = await request(app)
    .get('/addresses')
    .expect('Content-Type', /json/)
    .expect(200);

  assert({
    given: 'a GET request',
    should: 'return an array of addresses',
    actual: Array.isArray(res.body.addresses),
    expected: true,
  });

  assert({
    given: 'a GET request',
    should: 'return an array of addresses',
    actual: Object.keys(res.body.addresses[0]),
    expected: ['street', 'suite', 'city', 'zipcode', 'geo'],
  });
});
```

Rename our route in `app.js` and `routes/index.js` to `"addresses"` and move `handleListen` to `src/index.js`. Otherwise, every test would cause our server to run, and the tests wouldn't stop.

Here is how `app.js` looks now.

```js
/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION

Amplify Params - DO NOT EDIT */

const express = require('express');
const { applyMiddleware } = require('./middleware');
const { getAddresses } = require('./routes');

const app = express();
applyMiddleware(app);

app.get('/addresses', getAddresses);

module.exports = app;
```

And here is `src/index.js` with `app.listen`.

```js
const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const { handleListen } = require('./routes');

const port = 3000;
app.listen(port, handleListen(port, console.log));

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};
```

Let's implement the functions needed to compose `getAddresses`. First up is `liftReqRes`.

```js
describe('liftReqRes', async assert => {
  const req = { foo: 'bar' };
  const res = { baz: 'qux' };
  assert({
    given: 'a function, and two arguments (request and response)',
    should:
      'lift the arguments into an object and invoke the function with it',
    actual: liftReqRes(x => x)(req, res),
    expected: { req, res },
  });
});
```

Watch the test fail, then make it pass by implementing `liftReqRes`.

```js
const liftReqRes = (request, response) => ({ request, response });
```

We are going to execute our GET request with `axios.get`. Install [axios](https://github.com/axios/axios) by running `npm install axios` in your function's directory. We need to install a library for requests since Lambda functions don't have `fetch`. You could also install `node-fetch` or a polyfill if you prefer `fetch` over axios.

If `axios.get` is successful, the response has the [following shape](https://jsonplaceholder.typicode.com/users):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Leanne Graham",
      // ...
      "address": {
        "street": "Kulas Light",
        "zipCode": "9228-3847"
        // ...
      }
    }
    // ...
  ]
}
```

Here the `data` key comes from axios and not from the placeholder API.

```js
const getAddressesFromData = R.pipe(
  R.prop('data'),
  R.pluck('address')
);
```

`getAddressesFromData` expects an object which's `data` key contains an array of objects. It returns a new array containing the values that belong to each of these objects' `address` keys.

Subsequently, we are going to write the fetch function.

```js
const fetchAddresses = obj =>
  axios
    .get('https://jsonplaceholder.typicode.com/users')
    .then(response => ({
      ...obj,
      addresses: getAddressesFromData(response),
    }));
```

We chain `getAddressesFromData` on our promise using `.then`. Notice how we also perform a type lift again.

We'll also need to return a JSON response to our users. We can do that using `res.json`.

```js
const jsonAddresses = ({ res, addresses }) => res.json({ addresses });
```

Wait a minute! **Did we write three functions without unit tests?** 😱

Yes, we did. 😏

The trick about testing a Lambda function - and async code in general - is to choose what to test and how. Generally, you only need integration tests for functions that have side effects. BUT, if you compose an async function with pure functions, you want to write unit tests for the pure functions. This way, when the integration test fails, but the unit tests pass you at least know where the error is NOT located. If both the integration test and the unit tests fail, the unit tests will identify the error for you.

`fetchAddresses` is the function containing the I/O, no unit tests needed here.

So why did we not test `getAddressesFromData` and `jsonAddresses`?

You can certainly make a solid argument for writing unit tests for them, too. But in this case, I chose not to. `getAddressesFromData` is composed solely out of well-tested Ramda functions with little specialization. Therefore, there is almost nothing that could go wrong. `jsonAddresses`, on the other hand, is also very simple and essential for our integration test. If that part fails, it will probably have a distinct error. In conclusion, not much is gained by writing unit tests for these two functions.

Notice how, depending on your function, you might not want to write any unit tests and just integration tests.

Now compose these functions to get our `getAddresses` function.

```js
// full /routes/index.js
const axios = require('axios');
const R = require('ramda');

const { asyncPipe } = require('../fp');

const liftReqRes = f => (req, res) => f({ req, res });

const handleListen = R.curry((port, log) =>
  log(`Listening on port ${port}.`)
);

const getAddressesFromData = R.pipe(
  R.prop('data'),
  R.pluck('address')
);

const fetchAddresses = obj =>
  axios
    .get('https://jsonplaceholder.typicode.com/users')
    .then(response => ({
      ...obj,
      addresses: getAddressesFromData(response),
    }));

const jsonAddresses = ({ addresses, res }) => res.json({ addresses });
// highlight-start
const getAddresses = liftReqRes(
  asyncPipe(fetchAddresses, jsonAddresses)
);
// highlight-end

module.exports = { handleListen, getAddresses, liftReqRes };
```

Run `npm test`.

```bash
TAP version 13
# /addresses
Missing x-apigateway-event or x-apigateway-context header(s)
ok 1 Given a GET request: should return an array of addresses
ok 2 Given a GET request: should return an array of addresses
# handleListen()
ok 3 Given a port of 8000 and a log() function: should call log() with 'Listening on port 8000.'
# liftReqRes
ok 4 Given a function, and two arguments (request and response): should lift the arguments into an object and invoke the function with it
1..4
# tests 4
# pass  4
# ok
```

Our integration tests and unit tests pass now! 🚀

If you liked this article, you might also like ["How To Use AWS AppSync in Lambda Functions"](https://janhesters.com/how-to-use-aws-appsync-in-lambda-functions/) because you are going to learn how to connect your Lambda functions to your AppSync API, making it more powerful.

## Summary

We learned how to use function composition to make our code more modular. We wrote integration tests with Supertest and unit tests with RITEway for the Lambda function.
