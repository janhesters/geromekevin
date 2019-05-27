---
title: Localization with AWS Amplify
date: '2019-05-28'
description: Use Amplify's I18n module to translate your app
---

Translate your application dynamically in multiple languages with AWS Amplify's `I18n` module. This tutorial will teach you how to use Amplify's internationalization.

---

**Note:** This post is a tutorial for intermediates. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? For beginners, I recommend checking out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start) to learn the basics.

If you build an application for an international user base, it is probably a good idea to translate your app in the respective countries language. Localization enables your software to reach more users 🌎.

Translating your app with AWS Amplify is very straightforward. We'll go through it step by step in React, but the steps are the same for other frameworks.

Start by creating a new React app.

```bash
npx create-react-app amplify-localization && cd amplify-localization
```

You don't need to run `amplify init` to use the `I18n` module because it's independent of the could services. Run `yarn start` or `npm start` to view your application. No matter where you are from, it should now say "Edit `src/App.js` and save to reload."

Let's change that using Amplify's `I18n`. Add Amplify to your project.

```bash
yarn add aws-amplify
```

Create a new file `src/strings.js`.

```js
export const strings = {
  en: {
    appTitle1: 'Edit',
    appTitle2: 'and save to reload',
  },
  de: {
    appTitle1: 'Editiere',
    appTitle2: 'und speichere ab um neu zu laden',
  },
};
```

Feel free to add your native language. Next, we need to use the `I18n` module in `src/App.js`.

```js
import { I18n } from '@aws-amplify/core';

import { strings } from './strings';

I18n.putVocabularies(strings);
```

If your browser is set to German, or if you added your native language and your browser is set to that, you should already see the translated `appTitle`. If not, you can set it yourself by using `I18n.setLanguage('de')`. If you are using AWS Amplify on mobile, it cannot automatically detect your language. You will have to use another library to recognize it and then set it manually.

Let's take it a step further 👏🏻. What if you want to keep your strings where you use them? For example, I like to structure my projects by feature.

```bash
├──todos
│  ├── component
│  ├── reducer
│  ├── strings
│  └── test
└──user
   ├── component
   ├── reducer
   ├── strings
   └── test
```

You could either use a function from a well-tested library like [`mergeDeepRight` from Ramda](https://ramdajs.com/docs/#mergeDeepRight), or you write a function that merges one layer deep yourself. I recommend using a function from a library because it likely works better than anything you come up with yourself. Keep in mind that the keys for each language have to be unique. Otherwise, they will get overwritten by the latest key.

```js
// src/App.js
import { mergeDeepRight } from 'ramda';

import { strings as todosStrings } from './todos/strings';
import { strings as userStrings } from './user/strings';

I18n.putVocabularies(mergeDeepRight(todosStrings, userStrings));
```

That's it 👍🏻. Your app now correctly displays in multiple languages.

**Note:** You can clean up everything by running `amplify delete`.
