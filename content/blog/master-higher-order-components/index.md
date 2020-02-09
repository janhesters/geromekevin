---
title: Master Higher-Order Components in React Today
date: '2020-02-06'
description: Functions that take in and return React components.
tags: ['react', 'hoc', 'higher-order']
---

In the next ten minutes, you are going to understand how HOCs in React work. You will find out how you can write your own and how to compose them.

---

Understanding higher-order components (HOCs) is crucial if you want to become or consider yourself an advanced React developer. If you can't **name the four essential characteristics of HOCs**, this article is here to help you. Let's take a look at the formal definition of HOCs and understand the theory behind it.

**Note:** make sure you are ["Understanding Arrow Functions"](https://janhesters.com/understanding-arrow-functions/) and the basics of [React](https://reactjs.org/).

## Abstract

A Higher-Order component is a function that takes a component and returns a new component. The [React docs](https://reactjs.org/docs/higher-order-components.html) further state:

> "A higher-order component (HOC) is an advanced technique in React for reusing component logic. HOCs are not part of the React API, per se. They are a pattern that emerges from React’s compositional nature."

The theory behind HOCs comes from ...

## Function Composition

In mathematics, [function composition](https://en.wikipedia.org/wiki/Function_composition) is the act of combining functions to form a new function or a result, by applying one function to the result of another. In JavaScript, this would look like this:

```js
const inc = n => n + 1; // f
const double = n => n * 2; // g

// h(x) = (f ∘ g)(x) = f(g(x))
const doubleThenInc = x => inc(double(x));
```

Notice how we assign the combined functions to a new variable called `doubleThenInc`, which we can do because JavaScript has **first-class** functions. A programming language has first-class functions if it allows you to assign functions to variables.

We can abstract the composition to combine any two functions:

```js
const compose2 = (f, g) => x => f(g(x));

const doubleThenInc2 = compose2(inc, double);
```

We omit the argument `x` in the definition of `doubleThenInc2`. This means `doubleThenInc2` is defined **point-free**, which is when you define a function without mentioning its arguments. 

If we want to compose an arbitrary amount of functions, we need to [generalize the composition](https://medium.com/javascript-scene/curry-and-function-composition-2c208d774983).

```js
const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

const doubleThenInc3 = compose(inc, double);
```

More sophisticated versions of the `compose` function are frequently exposed by libraries that leverage HOCs such as Redux and Apollo. The arguments and return values of functions have to line up to compose them. For example, you can't compose a function that accepts an object and returns a string with a function that receives an array and returns a number. Since `inc` and `double` both take and return numbers, we can compose them in any order.

Additionally, all `doubleThenInc`s are **higher-order functions**. A higher-order function is a function that either receives or returns a function or does both.

```js
const multiply = multiplier => multiplicant => multiplier * multiplicant;

const double = multiply(2);

const map = f => arr => arr.map(f);

const doubleMap = map(double);

const numbers = [1, 2, 3];

doubleMap(numbers); // [2, 4, 6]
```

- `multiply` IS a higher-order function because it takes in a number and returns a function.
- `double` IS NOT a higher-order function because it neither receives nor returns a function. It is defined point-free.
- `map` IS a higher-order function because it both accepts and returns a function.
- `doubleMap` IS NOT a higher-order function because it neither receives nor returns a function. It is defined point-free.

React components can either be functions or classes. In JavaScript, [the `class` keyword](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/es6%20%26%20beyond/ch3.md#classes) is essentially a wrapper for the `function` keyword and handles prototypal inheritance. Since all components are functions in React (classes compile to constructor functions) and JavaScript has higher-order functions, we get HOCs for free. That is what the docs mean when they say HOCs "are a pattern that emerges from React’s compositional nature."

Now you should understand the basic definition of HOCs:

> A Higher-Order component is a function that takes a component and returns a new component.

Any function whose input and output is a React component is a HOC.

## HOCs by Example

Let's look at the definition of a higher-order component and write our own using TDD. I'm going to use [RITEway](https://github.com/ericelliott/riteway) to write the unit tests [because of its genius API](https://medium.com/javascript-scene/rethinking-unit-test-assertions-55f59358253f).

We can deduce two requirements from the definition:

1. HOCs are functions.
2. HOCs take a component and return a component.

We can capture these requirements in our unit tests.

```jsx
import React from 'react';
import { describe } from 'riteway';
import render from 'riteway/render-component.js';

import myHOC from './my-hoc.js';

function MyComponent({ title = 'Hello' }) {
  return <p className="title">{title}</p>;
}

describe('myHOC', async assert => {
  {
    const WrappedComponent = myHoc(MyComponent);
    const $ = render(<WrappedComponent />);

    assert({
      given: 'a component',
      should: 'return the component',
      actual: $('.title').html().trim(),
      expected: 'Hello',
    }); 
  }
});
```

The test checks both requirements because when this test passes, we can logically deduce that our HOC is a function and that it returns a component without spelling out those requirements explicitly. If the HOC is not a function, but you try to call it, it will throw and your unit test will fail with a good stack trace. Likewise, the test renders the return value of the HOC, which ensures it is a React component.

Notice how we did not test for `typeof function` here. Unit tests which only test types are an anti-pattern. It's redundant with simply calling the function and checking its output value. In general, type checks are redundant with well-written unit tests. This is why unit tests can catch most type errors, without the need for additional measures like type annotations (though annotations and type inference can still be useful to enable IDE tooling).

We can get the test to pass by making our HOC the [identity function](https://en.wikipedia.org/wiki/Identity_function).

```js
export default Component => Component;
```

### Why HOCs?

Our current HOC does nothing. **HOCs excel at abstracting logic or styling.** They allow you to avoid unnecessary code duplication. If you find yourself repeating certain JSX or logic patterns in your component, you might be able to abstract them away using HOCs.

For example, if you have a page for your web site or a screen for your React Native app, most pages or screens have the same layout. They all share elements such as headers, footers or formatting containers.

### Making Our HOC Useful

We can add styling abilities to our HOC and call it `withLayout` instead of `MyHOC`.

```jsx
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import React, { Fragment } from 'react';

export default Component => () => (
  <Fragment>
    <CssBaseline />
    <Container maxWidth="lg">
      <Component />
    </Container>
  </Fragment>
);
```

In the example above, I used one of my favorite UI component libraries [Material-UI](https://material-ui.com/). In React Native, I find myself writing similar layout HOCs using [React Navigation's `<SafeAreaView />`](https://reactnavigation.org/docs/en/handling-iphonex.html). What does our test say?

```bash
withLayout()
  ✔ Given a component: should return the component.
  passed: 1 of 1 tests (1.4s)
```

Still works! 👌🏻 We encounter a new problem here. Can you spot it?

If not, that is okay. Let me show you the test that exposes the error. Notice how I also changed the variable and file names to reflect the new functionality of our custom HOC.

```jsx
import React from 'react';
import { describe } from 'riteway';
import render from 'riteway/render-component';

// highlight-start
import withLayout from './with-layout.js';
// highlight-end

function MyComponent({ title = 'Hello' }) {
  return <p className="title">{title}</p>;
}

// highlight-start
describe('withLayout()', async assert => {
// highlight-end
    {
    // highlight-start
    const WrappedComponent = withLayout(MyComponent);
    // highlight-end
    const $ = render(<WrappedComponent />);

    assert({
      given: 'a component',
      should: 'return the component',
      actual: $('.title').html().trim(),
      expected: 'Hello',
    }); 
  }

  // highlight-start
  {
    const WrappedComponent = withLayout(MyComponent);
    const $ = render(<WrappedComponent title="foo" />);

    assert({
      given: 'props for the wrapped component',
      should: 'pass on the props to the wrapped component',
      actual: $('.title').html().trim(),
      expected: 'foo',
    }); 
  }
  // highlight-end 
});
```

The new test fails.

```bash
  withLayout()
    ✔  Given a component: should return a component
    ✖  Given props for the wrapped component: should pass on the props to the wrapped component
    --------------------------------------------------------------------------------------------
error fired ReferenceError: foo is not defined
        operator: deepEqual
        diff: "foo" => "Hello"
        source: at assert (<some-stack-trace>)

error Command failed with exit code 1.

  passed: 1, failed: 1 of 2 tests (1.4s)
```

The test exposes the problem: We don't pass `props` to the wrapped component. We can make the test pass by passing on the props the HOC receives.

```jsx
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import React, { Fragment } from 'react';

export default Component => props => (
  <Fragment>
    <CssBaseline />
    <Container maxWidth="lg">
      <Component {...props} />
    </Container>
  </Fragment>
);
```

However, the abstraction capabilities of HOCs wouldn't be as useful if they didn't have another key feature. [Eric Elliott describes](https://slack-redir.net/link?url=https%3A%2F%2Fmedium.com%2Fjavascript-scene%2Fdo-react-hooks-replace-higher-order-components-hocs-7ae4a08b7b58) it like this:

> "The primary benefit of HOCs is not what they enable (there are other ways to do it); it's how they compose together at the page root level."

In other words, **the key to using HOCs well is to know how and when to compose them**. We can write a test to demonstrate the "how". _Spoiler:_ it is fundamentally function composition.

```jsx
{
  const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

  const withTitle = Component => props => (
    <Component title="foo" {...props} />
  );
  const ComposedComponent = compose(
    withLayout,
    withTitle
  )(MyComponent);
  const $ = render(<ComposedComponent />);

  assert({
    given: 'used in composition with other HOCs',
    should: 'pass on the props of the other HOCs',
    actual: $('.title').html().trim(),
    expected: 'foo',
  }); 
}
```

We compose `withLayout` with `withTitle`. `withTitle` is a HOC that injects a `title` prop to a component. You probably encounter this when using [React Redux' `connect`](https://react-redux.js.org/api/connect) with `mapStateToProps`. It is common for HOCs to accept configuration objects similar to how `connect` does it with `mapStateToProps`. (In fact, it accepts two more arguments: `mapDispatchToProps` and `mergeProps`.) Our layout HOC could take in a string that specifies which layout to use.

```js
export default layoutType => Component => props => {
  if (layoutType === 'fancy') {
    // return something fancy 💅
  } else {
    // return something boring 😑
  } 
}
```

To answer the question of _when_ to use composition for HOCs, remember what I told you earlier. HOCs are excellent if you want to abstract away common logic between many components. We chose to give our function a layout functionality because that is one area that most screens of your application will share. Using `compose` you can define a HOC that you can use to wrap all your pages with.

### Real-World Example

Here is a real-world example of a `SignInForm` container component. See if you understand it, then read the explanation to check if you were correct.

```js
import { withFormik } from 'formik';
import compose from 'ramda/src/compose.js';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import SignInComponent from './sign-in-form-component.js';
import { isAuthenticating, signIn } from './user-authentication-reducer.js';
import { signInValidationSchema } from './validation-schema.js';

const initialFormValues = { email: '', password: '' };

const mapStateToProps = state => ({ loading: isAuthenticating(state) });

const formikConfig = {
  handleSubmit: ({ email, password }, { props: { signIn } }) => {
    signIn({ email, password });
  },
  mapPropsToValues: () => initialFormValues,
  validationSchema: signInValidationSchema,
};

// highlight-start
export default compose(
  withRouter,
  connect(
    mapStateToProps,
    { signIn }
  ),
  withFormik(formikConfig),
)(SignInComponent);
// highlight-end
```

### HOC Composition

In the example above we composed 3 different HOCs.

1. `withRouter` is a HOC from React Router DOM. It injects the `history` object, which we can use to navigate to the password reset screen, when the user clicks the "Forgot Password" button.
2. `connect` is a HOC from React Redux. We use it to connect our component to our Redux store. We inject the `loading` prop and the `signIn` action creator.
3. `withFormik` is a HOC from Formik. Formik let's you control local form state and handles form validation for you.

Sometimes you need to [copy over](https://reactjs.org/docs/higher-order-components.html#static-methods-must-be-copied-over) static properties such as `propTypes`, `defaultProps` and [`getStaticProps` (if you are using Next.js)](https://nextjs.org/learn/basics/fetching-data-for-pages) from the inner component to the resulting component. Here is a Higher-Order HOC (a function that returns a HOC), which does this for you.

```jsx
import hoistNonReactStatics from 'hoist-non-react-statics';

const hoistStatics = higherOrderComponent => Component => {
  const WrappedComponent = higherOrderComponent(Component);
  hoistNonReactStatics(WrappedComponent, Component);
  return WrappedComponent;
};
```

**BTW:** [When using HOCs you need to treat `ref`s special, too.](https://reactjs.org/docs/higher-order-components.html#refs-arent-passed-through) If you need to pass `ref`s through a component hierarchy, you should probably be using a hook for the `ref` instead of a HOC.

We know from function composition that you can only compose functions whose types line up. Similarly, you need to pay attention to the order in which you compose your HOCs. One HOC can inject props that another might depend on. If the one that depends on the props gets injected before the prop injecting HOC, your app might break.

```jsx
const formatTitleProp = ({ title, ...otherProps }) => ({
  title: title.toUpperCase(),
  ...otherProps,
});

const withTitle = Component => props => <Component title="Hello" {...props} />
const withFormattedTitle = Component => props =>
  <Component {...formatTitleProp(props)} />

const breakingApp = compose(
  withFormattedTitle,
  withTitle,
)(App); // 🔴 Breaks!

const workingApp = compose(
  withTitle,
  withFormattedTitle,
)(App); // ✅ Correct order!
```

If you switch the order of HOCs in the real-world example above, it will break, too. `withFormik(formikConfig)` depends on `signIn` being defined, and `transformProps` depends on both `history` and the `formikBag` props.

HOCs with implicit dependencies on each other may be a code smell. In some cases, it may be better to make those dependencies explicit, by importing the shared functionality into the components that need them, or taking the dependency as a configuration parameter of the HOC. It's probably ok to implicitly depend on something that's pretty universal to all your pages, such as your store provider.

That's it. 👏🏻 You have learned how to write custom HOCs and how to compose HOCs to generalize and reuse common logic and styling. 🎓

Do you want to **see another real-world HOC example** I wrote for open source? Check out ["How to Add a Badge to Icons in React Native"](https://janhesters.com/how-to-add-a-badge-to-icons-in-react-native/). The code of that tutorial [ended up in React Native Elements](https://react-native-elements.github.io/react-native-elements/docs/badge.html#withbadge-higher-order-component). And if you'd like to learn **how to use HOCs with TypeScript**, read ["TypeScript HOCs and Decorators in React"](https://janhesters.com/typescript-hoc-and-decorators-in-react/). If you prefer to write class- instead of function-components, these two articles show examples using `class`.

## Recap

Higher-order components:

1. Take a component and return a new component.
2. Emerge from the fact that HOCs are functions which always take and return the same type (a React component).
3. Are composable in a point-free, declarative way.
4. Are generally used to abstract and reuse component logic or styling.

We built a custom HOC and looked at a real-world example to understand how to compose HOCs.
