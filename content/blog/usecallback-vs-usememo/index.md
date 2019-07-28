---
title: useCallback vs useMemo
date: '2019-05-14'
description: useCallback is for functions and useMemo is for results.
tags: ['hooks', 'react', 'useCallback', 'useMemo']
---

What is the difference between `useCallBack` and `useMemo`? And why do `useMemo` and `useCallback` expect a function? If you've worked with React Hooks, you might have asked yourself these questions.

We will take a look at how they are distinct from another.

---

**Note:** This article assumes a basic understanding of Hooks. You should have read ["Hooks at a Glance."](https://reactjs.org/docs/hooks-overview.html).

## Abstract

The React docs say that [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback):

> Returns a memoized callback.

And that [useMemo](https://reactjs.org/docs/hooks-reference.html#usememo):

> Returns a memoized value.

In other words, `useCallback` gives you **[referential equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness) between renders** for **functions**. And `useMemo` gives you **referential equality between renders** for **values**.

`useCallback` and `useMemo` both expect a function and an array of dependencies. The difference is that `useCallback` returns its function when the dependencies change while `useMemo` calls its function and returns the result.

Since JavaScript has [first-class functions](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function), `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

## Translation

Let's understand and explain the abstract description above using simple examples. I'll go over everything, but feel free to skip what you already know.

### First-class functions

We said that in JavaScript functions are first-class. This means in JavaScript you can assign a function to a value.

```js
// values
const number = 1;
const greeting = 'Hello';

// function declaration
function foo() {
  return 'bar';
}

// named function expression - possible
// because functions are first-class
// and therefore usable as values
const otherFoo = function() {
  return 'bar';
};

// using arrow functions and implicit return
const anotherFoo = () => 'bar';

number; // 1
greeting; // 'Hello'
foo(); // 'bar'
otherFoo(); // 'bar'
anotherFoo(); // 'bar'
```

Storing functions in variables enables you to use them as (the _cursive_ points are important for React Hooks):

- _arguments to other functions_,
- _return values from functions_,
- values to an object's keys,
- _values in an array_,
- even as keys to the [Map object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

Functions that return functions or take functions as input are called [Higher-Order Functions](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function#Example_Return_a_function).

```js
const identity = x => x;

identity(1); // 1
// Used as Higher-Order Function
identity(foo);
// ƒ foo() {
//   return 'bar';
// }
identity(foo)(); // 'bar'
```

### Referential equality

If you use JavaScript, you probably know that there are two [equality comparison operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators). `==` for abstract equality and `===` for strict equality. [JavaScript's equality can be weird](https://www.youtube.com/watch?v=et8xNAc2ic8), and there are many great articles already written about this topic. Go read those for an in-depth look as I will only cover the basic cases relevant for `useCallback` and `useMemo`.

Referential equality uses strict equality comparison which is true if the operands are of the same type and the contents match.

```js
const greeting = 'hello';
const otherGreeting = 'hello';

function foo() {
  return 'bar';
}
const otherFoo = function() {
  return `bar`;
};
const anotherFoo = () => 'bar';
function sameFoo() {
  return 'bar';
}
const fooReference = foo;

'hello' === 'hello'; // true
greeting === otherGreeting; // true

foo === foo; // true
foo === otherFoo; // false
foo === anotherFoo; // false
foo === sameFoo; // false
foo === fooReference; // true
```

Notice how `foo === sameFoo` returns `false` (contrary to `greeting === otherGreeting`). This is because

1. two distinct objects are never equal for either strict or abstract comparisons,
2. an expression comparing objects is only true if the operands reference the same object,
3. and functions are objects in JavaScript.

`foo` and `sameFoo` have the same definition but reference two different objects.

### API

The APIs of `useCallback` and `useMemo` look similar. They both take in a function and an array of dependencies.

```js
useCallback(fn, deps);
useMemo(fn, deps);
```

So what is the difference? **`useCallback` returns its function uncalled** so you can call it later, while **`useMemo` calls its function and returns the result**.

```js
function foo() {
  return 'bar';
}

const memoizedCallback = useCallback(foo, []);
const memoizedResult = useMemo(foo, []);

memoizedCallback;
// ƒ foo() {
//   return 'bar';
// }
memoizedResult; // 'bar'
memoizedCallback(); // 'bar'
memoizedResult(); // 🔴 TypeError
```

---

**Side note:** Now - knowing about first class functions - you should understand why `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

In the real world, the examples above are meaningless. I just gave it to help you understand the API. If you can pass a function to `useCallback` or `useMemo` directly and you can use that function with empty dependencies, you could define the function outside of the component (and do without `useCallback` or `useMemo`). Therefore, in the real world, you will see something like this.

```js
function MyComponent({ foo, initial }) {
  const [bar, setBar] = useState(initial);
  // ...
  const memoizedCallback = useCallback(() => {
    // do something with foo and bar
    someFunc(foo, bar);
  }, [foo, bar]);
  const memoizedResult = useMemo(() => someOtherFunc(foo, bar), [
    foo,
    bar,
  ]);
  // ...
}
```

`useCallback` usually takes in an inline callback that calls the function that uses the dependencies. And `useMemo` takes in a "create function" that calls some function and returns its results.

---

**Another side note:** The following might be trivial for you, but I had to think about it a long time to get it. _The following code is wrong_. You can't use `useCallback` to memoize values. Meaning `useCallback(fn(), deps)` isn't a thing.

```jsx
function sum(a, b) {
  // highlight-start
  console.log('sum() ran');
  // highlight-end
  return a + b;
}

function App() {
  const [val1, setVal1] = useState(0);
  const [val2, setVal2] = useState(0);
  const [name, setName] = useState('Jim');

  // highlight-start
  const result = useCallback(sum(val1, val2), [val1, val2]);
  // highlight-end

  return (
    <div className="App">
      <input
        value={val1}
        onChange={({ target }) =>
          setVal1(parseInt(target.value || 0, 10))
        }
      />
      <input
        value={val2}
        onChange={({ target }) =>
          setVal2(parseInt(target.value || 0, 10))
        }
      />
      <input
        placeholder="Name"
        value={name}
        onChange={({ target }) => setName(target.value)}
      />
      <p>{result}</p>
    </div>
  );
}
```

Whenever you change `name` `sum` recalculates. **`useCallback` and `useMemo` are so useful because they allow lazy evaluation**. `result` is evaluated eagerly on every render. Try it out and take a look at your console.

---

So why do we need two Hooks dedicated to memoizing values?

## Usage

You want to use `useCallback` or `useMemo` whenever you depend on referential equality between renders. I find myself mostly using it for [`useEffect`](https://overreacted.io/a-complete-guide-to-useeffect/), [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo) and `useMemo` to [replace `shouldComponentUpdate`](https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-shouldcomponentupdate) from `React.PureComponent` because the dependencies of these Hooks get checked for referential equality.

Let's say you have a component that given a `userId` displays the user's data.

```jsx
import React, { useEffect, useState } from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

function User({ userId }) {
  const [user, setUser] = useState({ name: '', email: '' });

  const fetchUser = async () => {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );
    const newUser = await res.json();
    setUser(newUser);
  };

  useEffect(() => {
    fetchUser();
  }, []);
  return (
    <ListItem dense divider>
      <ListItemText primary={user.name} secondary={user.email} />
    </ListItem>
  );
}

export default User;
```

Can you spot the mistake(s)?

If you have [`eslint-plugin-react-hooks`](https://www.npmjs.com/package/eslint-plugin-react-hooks) installed, it will yell at you for omitting `fetchUser` from `useEffect`'s dependencies. But mindlessly adding it will actually create an infinite loop!

In React functions defined in function components get re-created on every render [because of closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures), which results in referential inequality.

```js
const fetchUser = async () => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );
  const newUser = await res.json();
  // highlight-start
  setUser(newUser); // 🔴 setState triggers re-render
  // highlight-end
};

useEffect(() => {
  fetchUser();
  // highlight-start
}, [fetchUser]); // fetchUser is a new function on every render
// highlight-end
```

There are two ways to solve this issue. Admittedly the most elegant would be to move `fetchUser` inside `useEffect` and add `userId` as a dependency.

```js
// 1. Way to solve the infinite loop
useEffect(() => {
  const fetchUser = async () => {
    const res = await fetch(
      // highlight-start
      `https://jsonplaceholder.typicode.com/users/${userId}`
      // highlight-end
    );
    const newUser = await res.json();
    setUser(newUser); // Triggers re-render, but ...
  };

  fetchUser();
  // highlight-start
}, [userId]); // ✅ ... userId stays the same.
// highlight-end
```

But, this is an article about `useCallback` and `useMemo`, so let's solve the problem using the former. (And, maybe you would like to use `fetchUser` function in multiple places.)

You can define `fetchUser` with `useCallback` so that the function stays the same, unless `userId` changes.

```js
// 2. Way to solve the infinite loop
// highlight-start
const fetchUser = useCallback(async () => {
  // highlight-end
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );
  const newUser = await res.json();
  setUser(newUser);
}, [userId]);

useEffect(() => {
  fetchUser();
  // highlight-start
}, [fetchUser]); // ✅ fetchUser stays the same between renders
// highlight-end
```

And lastly, let's say you filter all users and display them in a list.

```js
// Some FP magic 🧙🏼‍♂️
const filter = (f, arr) => arr.filter(f);
const prop = key => obj => obj[key];
const getName = prop('name');
const strIncludes = query => str => str.includes(query);
const toLower = str => str.toLowerCase();
const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);
const nameIncludes = query =>
  pipe(
    getName,
    toLower,
    strIncludes(toLower(query))
  );

function UserList({ query, users }) {
  // 🔴 Recalculated on every render
  const filteredUsers = filter(nameIncludes(query), users);
  // ...
}
```

This is inefficient. We can use `useMemo` to only recalculate the filtered users, when the query changes.

```js
function UserList({ query, users }) {
  // ✅ Recalculated when query or users change
  const filteredUsers = useMemo(
    () => filter(nameIncludes(query), users),
    [query, users]
  );
  // ...
}
```

## Summary

- With `useCallback` you can define a function that has referential equality between renders.
- You can use `useMemo` to calculate a value that has referential equality between renders.

Both only change their return value when their dependencies change.
