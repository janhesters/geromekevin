---
title: Setting Up a Project with CI/CD Using Amplify
date: '2019-08-20'
description: Use Husky and the Amplify console.
tags:
  [
    'amplify',
    'ci/cd',
    'riteway',
    'testcafe',
    'eslint',
    'unit-testing',
    'functional-testing',
  ]
---

In this tutorial, you are going to learn **how to set up a project with CI/CD**. We are going to **use the Amplify console** to automate our deployment.

---

**Note:** This article is a tutorial for developers who are familiar with the basics of Amplify. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? I recommend beginners to check out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start).

To **decrease your deployment risk**, you need to **increase your deployment frequency**. Deploying more often with small incremental changes means:

- If there is a bug, there is **less code surface** that could've caused the bug.
- **Your users get to enjoy** a constant stream of **new features**.
- You and your team will **feel confident deploying your software**.

You can frequently deploy by using CI/CD, which stands for _continuous integration and continuous deployment_. It is the practice of automating your tests and your static analysis to ensure your code works and is properly formatted. Therefore, **CI/CD depends on good test coverage**.

In this article, **you will see an example using static analysis** with ESLint and Prettier, **unit tests** with RITEway, [**and functional tests** with TestCafe](https://janhesters.com/e2e-testing-amplify-apps/). You will learn how to set up your project with these tools and how to automate them. Lastly, we will **host the app using the Amplify console, which will run our tests before each deployment for us.**

## Static Analysis

If you want to code along, start by initializing a React app with [Create React App](https://facebook.github.io/create-react-app/). I will explicitly point out when you need a different configuration, e.g. if you are using React Native, Vue or Angular.

```bash
npx create-react-app ci-cd-example
```

### ESLint

[ESLint](https://eslint.org/) is a JavaScript linting tool, which can find and fix problematic patterns or style guide violations in your code.

```bash
yarn add --dev eslint-plugin-simple-import-sort
```

Or use `npm install --save-dev`. In apps created without CRA, you will need to install `eslint`, too.

If you use CRA, you can add the following code to the `"eslintConfig"` key in `package.json`. Otherwise, add it to your `.eslintrc.json`.

```json
{
  "extends": "react-app",
  "plugins": ["simple-import-sort"],
  "rules": {
    "simple-import-sort/sort": "error",
    "import/order": "off"
  }
}
```

React projects which are set up with CRA come with an [ESLint configuration](https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app/index.js). If you'd use this setup outside of CRA you would extend `"eslint:recommended"` instead of `"react-app"`. Furthermore, you might want to set `parserOptions`'s `ecmaVersion` to `2019`, configure the `env` key and so on. Make sure you cover for the configuration that the React app plugin usually supplies.

Add a `"lint"` script to your `package.json`.

```json
"lint": "echo 'Linting...' && eslint --ignore-path .gitignore . && echo 'Lint complete.'",
```

Using the `--ignore-path` flag, we can re-use our `.gitignore` to make sure we only lint files that we wrote.

### Prettier

Prettier is a viral tool used to format your code.

```bash
yarn add --dev prettier eslint-plugin-prettier eslint-config-prettier
```

`eslint-plugin-prettier` runs `prettier` for you when you lint. `eslint-config-prettier` will disable all the ESLint rules that are irrelevant because of Prettier. That means if you run the lint script (see below), or you have your editor configured to integrate ESLint, you won't see any errors for conflicting rules.

Extend your ESLint config.

```json
{
  "extends": ["react-app", "plugin:prettier/recommended"],
  "plugins": ["simple-import-sort"],
  "rules": {
    "simple-import-sort/sort": "error",
    "import/order": "off"
  }
}
```

Prettier's settings are configured using a file called `.prettierrc`.

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

Add a `"format"` script that fixes your code.

```json
"format": "yarn --silent lint --fix",
```

If ESLint finds zero errors, it prints out nothing. We add `echo 'Lint complete.'` to verify that our lint script ran. `--silent` (or `-s`) suppresses some unnecessary output of the commands and keeps your console clean. Note that for NPM you have to pass on flags like `--fix` using an extra `--`.

```json
"format": "npm run -s lint -- --fix && echo 'Lint complete.'",
```

## Unit Tests

We are going to use [RITEway](https://github.com/ericelliott/riteway) for our unit tests because of its [genius API](https://medium.com/javascript-scene/rethinking-unit-test-assertions-55f59358253f). Note that RITEway does not work with React Native, because there is no good open-source mock for the React Native components (e.g. `<View />`, `<Text />`, etc.). If you'd like to use the RITEway API with Jest, which has a RN mock, try out [RITEway-Jest](https://github.com/janhesters/riteway-jest).

### RITEway

```bash
yarn add --dev riteway @babel/core @babel/polyfill @babel/preset-env @babel/register @babel/preset-react
```

We install RITEway alongside some Babel plugins. We need to add these dependencies to transpile React and modern JavaScript code. Add a `.babelrc` to configure these plugins.

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": ["last 2 versions", "safari >= 7"]
      }
    ],
    "@babel/preset-react"
  ]
}
```

If you use Gatsby, you will need some [additional configuration](https://www.gatsbyjs.org/docs/babel/#how-to-use-a-custom-babelrc-file).

Now, we need some code with tests. Delete `index.css`, `App.css` and `logo.svg` as well as all references to these files in `App.js` and `index.js`. Afterwards, add a folder called `sum/` within `src/` and create two files (`index.js` and `sum.test.js`) in it.

We will create a simple `sum` function, so we have some unit tests.

```js
// src/sum/index.js
const sum = (a = 0, b = 0) => a + b;

export default sum;
```

Here are the tests for `sum`.

```js
// src/sum/sum.test.js
import { describe } from 'riteway';

import sum from '.';

describe('sum()', async assert => {
  const should = 'return the correct sum';

  assert({
    given: 'no arguments',
    should: 'return 0',
    actual: sum(),
    expected: 0,
  });

  assert({
    given: 'zero',
    should,
    actual: sum(2, 0),
    expected: 2,
  });

  assert({
    given: 'negative numbers',
    should,
    actual: sum(1, -4),
    expected: -3,
  });
});
```

Change your `<App />` component to use `sum` to count the users clicks.

```js
// App.js
import React, { useState } from 'react';

import sum from './sum';

function App() {
  const [number, setNumber] = useState(0);

  function handleClick() {
    setNumber(sum(number, 1));
  }

  return (
    <div>
      <button className="increment-button" onClick={handleClick}>
        Increment
      </button>
      <p className="number">{number}</p>
    </div>
  );
}

export default App;
```

And add tests for the `<App />` component.

```js
// App.test.js
import React from 'react';
import { describe } from 'riteway';
import render from 'riteway/render-component';

import App from './App';

describe('App component', async assert => {
  const createApp = (props = {}) => render(<App {...props} />);

  {
    const props = {};
    const $ = createApp(props);

    assert({
      given: 'no props',
      should: 'render a button',
      actual: $('.increment-button').length,
      expected: 1,
    });
  }

  {
    const props = {};
    const $ = createApp(props);

    assert({
      given: 'no props',
      should: 'suggest render a number',
      actual: $('.number')
        .html()
        .trim(),
      expected: '0',
    });
  }
});
```

Lastly, we need to create a file in `src/` called `index.test.js`. In it import all other test files that contain unit tests.

```js
import './sum/sum.test';
import './App.test';
```

Importing all tests in a test file allows us to be selective about which tests we run, which can be helpful as your project grows.

With these basic tests ready, we can configure `package.json`.

```json
"unit-tests": "NODE_ENV=test node -r @babel/register -r @babel/polyfill ./src/index.test.js",
```

If you'd rather use a regex to decide which tests to run, you can call `"test"` with `'src/**/*.test.js'`. Currently, we have to run `yarn unit-tests` any time we want to run our tests. We can automate this process using watch.

### watch

We install [watch](https://github.com/mikeal/watch) to have a script running, which will run our tests every time a file changes. (**Note:** watch might need an additional setup to work on Windows.)

```bash
yarn add --dev watch tap-nirvana
```

We additionally add `tap-nirvana` which colors our test output, making it easier to read. Only our `"watch"` script will have colored output, because we don't care about that for our CI/CD processes.

```json
"watch": "watch 'clear && yarn -s unit-tests | tap-nirvana && yarn -s format' src"
```

Using `yarn watch` all our tests run and our code gets formatted each time we hit save.

### Bonus: Debugging

Sometimes you get an error, and you'd like to use the `debugger` statement in your tests. We can streamline this process by adding a `debug` script.

```json
"debug": "NODE_ENV=test node --inspect-brk -r @babel/register -r @babel/polyfill ./src/index.test.js"
```

If you run this script, you can open Chrome and visit `chrome://inspect` to jump to your break point.

## Functional Tests

For our functional tests, we will use [TestCafe](https://github.com/DevExpress/testcafe). If you prefer Cypress, that's okay, too. They are both great. I chose TestCafe, since it supports several browsers.

```bash
yarn add --dev testcafe eslint-plugin-testcafe
```

TestCafe supplies two global variables to its tests: `fixture` and `test`. To avoid ESLint yelling at us about these variables being `undefined`, we add the `eslint-plugin-testcafe` and configure it in our `.eslintrc.json`.

```json
"extends": [
  "react-app",
  "plugin:testcafe/recommended",
  "plugin:prettier/recommended"
],
"plugins": [
  "simple-import-sort",
  "testcafe"
],
```

Consequently, write a test in `src/functional-tests/index.js`.

```js
import { Selector } from 'testcafe';

fixture`CI/CD Example`.page('http://localhost:3000');

test('Page should load and display the "increment" button', async t => {
  const actual = Selector('.increment-button').innerText;
  const expected = 'Increment';

  await t.expect(actual).eql(expected);
});
```

Lastly, add a `functional-tests` script to your `package.json`.

```json
"functional-tests": "testcafe 'chrome:headless' src/functional-tests/",
```

We run Chrome in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome) for two reasons.

- The first reason is to **speed up the tests** during the development by not painting anything. Rendering usually takes the most time while running functional tests. **Keep in mind:** for small applications, this might be overkill. Another neat trick you can do as your application grows is to [run your functional tests in parallel](https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/concurrent-test-execution.html). Make sure your tests are sufficiently isolated from each other so that they can run in parallel and random order.
- The second reason is **headless mode allows our tests to run in the Amplify console**. As far as I know, you can't run a real Chrome instance in the console that paints to the DOM.

**Tip:** You can use [TestCafe's meta tags](https://medium.com/@mwq27/testcafe-organizing-tests-with-metadata-26900dbfdf55) to differentiate between headless tests for development & pre-deployment and smoke tests that actually render something for post-deployment.

If you run your functional tests, make sure to run `yarn start` first.

## CI/CD

We can add a `"validate"` script that checks if everything works. You could manually run this script any time you commit new code to Git.

```json
"validate": "yarn -s unit-tests && yarn -s lint && yarn -s functional-tests --app 'yarn start' --app-init-delay 4000",
```

Notice the `--app` and the `--app-init-delay` flags. The former runs `yarn start` before our tests and terminates it when they finish. The ladder delays the beginning of the tests for 4 seconds. We need the delay because React apps usually take some time to load. If the tests run too early, they fail because they can't find the DOM elements.

We want to automate this script to run when we commit new files.

### Husky

[Husky](https://github.com/typicode/husky#readme) can automatically run `yarn` or `npm` commands by hooking into your Git commits. (You can take a look at your Git hooks under `.git/hooks/`.)

```bash
yarn add --dev husky
```

All we need to do now is add a `"husky"` key to `package.json` that calls `"validate"` using the "`pre-commit"` hook.

```json
"husky": {
  "hooks": {
    "pre-commit": "yarn -s validate"
  }
},
```

The script causes `"validate"` to run any time you commit to Git.

### Amplify Console

When you deploy using the [Amplify console](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html), you can get it to run the validate script before deploying. You might ask yourself: "Why would we want to run it again? We just ran it with the `"precommit"` hook." We rerun it to avoid the "It works on my end 🤷🏻‍♂️" problem. The tests might have passed on your machine, but they need to pass after they've been deployed, too. For example, what if your server runs on a different Node version? Or maybe you forgot to add some environment variables?

The Amplify console makes deployment easy by [connecting to your GitHub repo](https://dev.to/dannyaziz97/deploying-react-with-aws-amplify-console-3dka). In the console click on "Connect app", then choose GitHub and select your repository and branch. Afterwards, jump into your ["Build settings"](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html#installing-os-packages) and click "edit".

```yml
version: 0.1
frontend:
  phases:
    preBuild:
      commands:
        - wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
        - yum install -y ./google-chrome-stable_current_*.rpm
        - yarn install
        - yarn validate
    build:
      commands:
        - yarn run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Let's break this down.

- `wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm` loads Chrome so we can install it using [yum](https://linuxwiki.com/yum).
- `yum install -y ./google-chrome-stable_current_*.rpm` installs Chrome.
- `yarn install` installs our node modules.
- `yarn validate` runs our validate script

Since we added these scripts to the `preBuild` `commands` section, they will run before we build the app. If any of the tests fail, the deploy is being aborted. If there was already a passing build deployed, the console will automatically perform a rollback to it.

That's it! 🚀 You can now deploy your projects with confidence.

If you liked this tutorial, you might want to read about ["Multiple Environments with AWS Amplify"](https://janhesters.com/multiple-environments-with-aws-amplify/) because effectively collaborating in teams is an essential skill.

### Summary

Here is our final `package.json`:

```json
{
  "name": "ci-cd-example",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^16.8.6",
    "react-dom": "^16.8.6",
    "react-scripts": "3.0.1"
  },
  "husky": {
    "hooks": {
      "pre-commit": "yarn -s validate"
    }
  },
  "scripts": {
    "build": "react-scripts build",
    "eject": "react-scripts eject",
    "format": "yarn -s lint --fix && echo 'Lint complete.'",
    "functional-tests": "testcafe 'chrome:headless' src/functional-tests/",
    "lint": "eslint --ignore-path .gitignore .",
    "start": "react-scripts start",
    "unit-tests": "NODE_ENV=test node -r @babel/register -r @babel/polyfill ./src/index.unit-test.js",
    "validate": "yarn -s unit-tests && yarn -s lint && yarn -s functional-tests --app 'yarn start' --app-init-delay 4000",
    "watch": "watch 'clear && yarn -s unit-tests | tap-nirvana && yarn -s format' src"
  },
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
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@babel/core": "^7.5.5",
    "@babel/polyfill": "^7.4.4",
    "@babel/preset-env": "^7.5.5",
    "@babel/preset-react": "^7.0.0",
    "@babel/register": "^7.5.5",
    "eslint-config-prettier": "^6.0.0",
    "eslint-plugin-prettier": "^3.1.0",
    "eslint-plugin-simple-import-sort": "^4.0.0",
    "eslint-plugin-testcafe": "^0.2.1",
    "husky": "^3.0.2",
    "prettier": "^1.18.2",
    "riteway": "^6.1.0",
    "tap-nirvana": "^1.1.0",
    "testcafe": "^1.3.3",
    "watch": "^1.0.2"
  }
}
```

We used ESLint with Prettier to format our code. We wrote unit tests with RITEway and created a `"watch"` script to test our code every time save. Furthermore, we added functional tests with TestCafe. We set up Husky to `"validate"` our code and used the Amplify console to do the same before we deploy.
