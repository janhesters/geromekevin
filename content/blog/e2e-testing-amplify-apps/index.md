---
title: End To End Testing Amplify Apps
date: '2019-08-27'
description: Do what you always do and use Amplify's helper methods for setup and teardown.
tags: ['testcafe', 'functional-testing', 'react', 'amplify']
---

How do you write E2E tests for Amplify apps? In this tutorial, you will see an example using TestCafe. It is easier than you might think.

---

**Note:** This article is a tutorial for developers who are familiar with the basics of Amplify. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? I recommend beginners to check out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start).

After my last article ["Setting Up a Project with CI/CD Using Amplify"](https://janhesters.com/setting-up-a-project-with-ci-cd-using-amplify/), I've been asked how I write E2E tests for Amplify apps. My first answer was "like you always do." But I guess people are having trouble with their setup and teardown for functional tests.

Let's build a simple React app where I show you how to write E2E tests with [TestCafe](https://devexpress.github.io/testcafe/). If you prefer Cypress, that is fine, too. They are both excellent tools.

**Note:** This article only covers UI tests. If you want to test Lambda functions, you can learn the tricks I use to test (and write more modular) Lambda functions. Read ["Testing Lambda Functions (feat. Amplify)"](https://janhesters.com/testing-lamba-functions/) because it explains these concepts in-depth.

## Setup

Create a new React app.

```bash
npx create-react-app end-to-end-tests-tutorial
```

Install TestCafe. Optionally configure ESLint, and Prettier.

```bash
yarn add --dev testcafe eslint-plugin-testcafe eslint-plugin-simple-import-sort prettier eslint-plugin-prettier eslint-config-prettier node-fetch
```

If you use ESLint and Prettier, configure them in your `package.json`.

```json
"eslintConfig": {
    "extends": [
        "react-app",
        "plugin:testcafe/recommended",
        "plugin:prettier/recommended"
    ],
    "plugins": ["simple-import-sort", "testcafe"],
    "rules": {
        "simple-import-sort/sort": "error",
        "import/order": "off"
    }
},
```

Add the following scripts.

```bash
"lint": "eslint --ignore-path .gitignore .",
"format": "yarn --silent lint --fix && echo 'Lint complete.'",
"functional-tests": "testcafe chrome src/functional-tests/ --app 'yarn start' --app-init-delay 4000",
```

In my production setups, I like to run my functional tests in parallel and headless mode. You can [learn the reasoning behind that by reading my article about CI/CD](http://janhesters:8000/setting-up-a-project-with-ci-cd-using-amplify/). I keep the setup for this tutorial simple because it makes a different point.

Here is my `.prettierrc`, which further configures Prettier.

```json
{
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "htmlWhitespaceSensitivity": "css",
  "insertPragma": false,
  "jsxBracketSameLine": false,
  "jsxSingleQuote": false,
  "printWidth": 80,
  "proseWrap": "always",
  "quoteProps": "as-needed",
  "requirePragma": false,
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "useTabs": false
}
```

Delete `App.css` and `logo.svg` in your `src/` folder.

Next, install AWS Amplify.

```bash
yarn add aws-amplify
```

Initialize Amplify and add authentication.

```bash
# highlight-start
amplify init
# highlight-end
Note: It is recommended to run this command from the root of your app directory
? Enter a name for the project
endtoendteststutoria
? Enter a name for the environment
master
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
<your-amplify-cli-profile>

# highlight-start
amplify add auth
# highlight-end
Using service: Cognito, provided by: awscloudformation
 
The current configured provider is Amazon Cognito. 

Do you want to use the default authentication and security configuration?
Default configuration
Warning: you will not be able to edit these selections. 
How do you want users to be able to sign in?
Email
Do you want to configure advanced settings?
No, I am done.

# highlight-start
amplify push
# highlight-end
```

Configure Amplify in your `src/index.js` file.

```js
import Amplify from '@aws-amplify/core';
import config from './aws-exports';
Amplify.configure(config);
```

Here is the UI for `src/App.js`.

```jsx
import Auth from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import React, { useEffect, useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        setUser(currentUser.username);
      } catch (err) {
        if (err !== 'not authenticated') {
          console.log(err);
        }
      }
    }

    checkUser();

    const authListener = ({
      payload: {
        data: { username },
        event,
      },
    }) => {
      if (event === 'signIn') {
        setUser(username);
      }
      if (event === 'signOut') {
        setUser(null);
      }
    };

    Hub.listen('auth', authListener);
    return () => {
      Hub.remove('auth', authListener);
    };
  }, []);

  async function handleSignIn() {
    await Auth.signIn(email, password);
    setEmail('');
    setPassword('');
  }

  async function handleSignOut() {
    await Auth.signOut();
  }

  if (user) {
    return (
      <button className="sign-out-button" onClick={handleSignOut}>
        Sign Out
      </button>
    );
  }

  return (
    <>
      <input
        className="email-input"
        onChange={({ target }) => setEmail(target.value)}
        placeholder="Email"
        value={email}
      />
      <input
        className="password-input"
        onChange={({ target }) => setPassword(target.value)}
        placeholder="Password"
        value={password}
      />
      <button className="sign-in-button" onClick={handleSignIn}>
        Sign In
      </button>
    </>
  );
}

export default App;
```

Instead of using `withAuthenticator`, I decided to show you an example with manual authentication. It contains enough side effects to give you an idea of how E2E tests should work. Before you write tests for the app, make sure to create an account using the Cognito console. Verify that the account works using your app.

## E2E Tests

Create a new folder `src/functional-tests/` with an `index.js` file. We are going to write our tests here.

```js
import { Selector } from 'testcafe';

const createFixtures = ({
  validEmail = '<your-test-users-email-here>',
  validPassword = '<your-test-users-password-here>',
} = {}) => ({ validEmail, validPassword });

fixture`E2E Testing Tutorial`.page('http://localhost:3000');

test('Page should load and display the "sign in" button', async t => {
  const actual = await Selector('.sign-in-button').innerText;
  const expected = 'Sign In';

  await t.expect(actual).eql(expected);
});

test('User should be able to log in', async t => {
  const { validEmail, validPassword } = createFixtures();
  await t.typeText('.email-input', validEmail);
  await t.typeText('.password-input', validPassword);
  const signInButton = await Selector('.sign-in-button');

  await t.click(signInButton);

  const actual = await Selector('.sign-out-button').innerText;
  const expected = 'Sign Out';

  await t.expect(actual).eql(expected);
}).after(async t => {
  const signOutButton = await Selector('.sign-out-button');

  await t.click(signOutButton);
});

test.before(async t => {
  const { validEmail, validPassword } = createFixtures();
  await t.typeText('.email-input', validEmail);
  await t.typeText('.password-input', validPassword);
  const signInButton = await Selector('.sign-in-button');

  await t.click(signInButton);
})('User should be able to sign out', async t => {
  const signOutButton = await Selector('.sign-out-button');

  await t.click(signOutButton);

  const actual = await Selector('.sign-in-button').innerText;
  const expected = 'Sign In';

  await t.expect(actual).eql(expected);
});
```

Let's go through this code. 🤓

- We import `Selector` from TestCafe. It lets us select elements in our functional tests.
- We define the function `createFixtures` to help us create test code, which saves time as your test suite grows. In your production application, you want to test your UI thoroughly. For example, you could amend this function with `invalidEmail`. Afterwards, test if your UI displays a friendly error message when the user tries to enter an invalid email. Another use case would be to log in [different users with different permissions](http://janhesters:8000/lambda-triggers-and-read-only-permissions/) (e.g. admins, anonymous visitors, etc.).
- `fixture` is TestCafe's method organizing tests into categories.
- The first test checks whether the page loads. I show this simple test to you to make you familiar with TestCafe's syntax.
- The next test logs the user in. Notice how we use [AAA (arrange, act, assert)](https://twitter.com/JS_Cheerleader/status/1155218131956060160) to structure our tests. Additionally, we use the `after` [test hook](https://devexpress.github.io/testcafe/documentation/test-api/test-code-structure.html#test-hooks) to clean up.
- The last test tests whether the user can log out. Here we use the `before` test hook. We can write setup and teardown code for our tests using the hooks, which you need to parallelize your tests. 

Notice that you could import Amplify and use it in your test hooks. As an example, you could create test data using `API.graphqlOperation` and then use it in your test.

**Important:** It is bad to run your E2E tests during the development on your production resources because you can alter crucial data. You want to set up your project with a development environment. Check out ["Multiple Environments with AWS Amplify"](http://janhesters.com/multiple-environments-with-aws-amplify/) to learn how to separate your development resources from your production resources. I only used a single environment here to keep the tutorial simple. Note that you do want to [set up smoke tests for your CI/CD flow](http://janhesters.com/setting-up-a-project-with-ci-cd-using-amplify/).

As mentioned earlier, the point of this tutorial was not to show you the ideal setup. What you should take away is that **it is okay to [omit mocks](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a) and hit your API**. There are exceptions of course e.g.

- **when** you are building a crypto app where **using the real API is expensive** because it talks to the blockchain.
- **when you need to run a simulation**. SpaceX doesn't want to waste a rocket each time they run their tests, so they simulate the whole rocket and the world's physics.

But, especially since Amplify is so cheap, you can **go all out and test your app using your real API through your UI**. Additionally, feel free to **call Amplify's helper methods for setup and teardown** in your tests.

If you enjoyed this article, you might want to read ["How to Access the User in Lambda Functions (with Amplify)"](https://janhesters.com/how-to-access-the-user-in-lambda-functions-with-amplify/) because, alongside E2E testing, it is an essential skill for every Amplify developer.

## Summary

We wrote some E2E tests using TestCafe for our Amplify application. We did that without using mocks because it is okay to hit your development API in your tests.
