---
title: Understanding Arrow Functions
date: '2019-07-09'
description: Implicitly returning function expressions without this.
tags: ['javascript', 'arrow functions', 'beginner']
---

In this tutorial you are going to learn the answers to the questions: "What is an arrow function in JavaScript?" and "How is an arrow function different to a regular function (keyword)?"

---

An arrow function is like a normal function just with 4 key differences:

1. They have a [different syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) (duh).
2. There is no form of arrow [function declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function), only expressions.
3. They don't get their own `this`.
4. They have an implicit return.

## 1. Different syntax

Here is the syntax of an arrow function compared to a regular `function` keyword. I use [Immediately Invoked Function Expression](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) for both functions.

```js
(function() {
  console.log('function keyword');
})();

(() => {
  console.log('arrow function');
})();
```

Notice that if an arrow function takes a single argument without any fanciness like destructuring, you may omit the brackets around its parameters.

```js
// You need brackets
const noArguments = () => {};
// You can ommit the brackets.
const oneArgument = n => {
  return n * 2;
};
// You need brackets
const defaultParameter = (name = 'Anon') => {
  return name;
};
// You need brackets.
const destructuringOneArgment = ({ name }) => {
  return name;
};
// You need brackets.
const moreThanOneArgument = (a, b) => {
  return a + b;
};
```

## 2. Only expressions

You can also name a function by writing a variable name after the `function` keyword. This is called "function declaration". There are no function declarations for arrow functions, just anonymous function expressions.

```js
// function declaration with keyword
function decleration() {
  console.log('function declaration with keyword');
}

// function expression with keyword
const keywordExpression = function() {
  console.log('function expression with keyword');
};

// function declaration with arrow function
// 🔴 Not a thing.

// function expression with arrow function
const arrowExpression = () => {
  console.log('function expression with keyword');
};
```

The difference between a function declaration and a function expression is that they are parsed at different times. The declaration is defined everywhere in its scope, whereas the expression is only defined when its line is reached.

```javascript
declaration(); // ✅ Okay

function decleration() {}

foo(); // 🔴 TypeError: foo is not a function
var foo = () => {};
// We could've also written var foo = function() {}
bar(); // 🔴 ReferenceError: Cannot access 'bar' before initialization
const bar = () => {};
```

You can also see the difference between `const` and `var` here. Since `foo` was declared using the `var` keyword, it is hoisted, and its value is `undefined`. `foo()` tries to call `undefined`, but its obviously not a function. Since `const` doesn't hoist invoking `bar` throws a reference error.

## 3. No this

Like other languages, JavaScript has a [`this` keyword](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this). There are [several ways `this` is bound explicitly or implicitly](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch1.md). We are only going to focus on the behavior relevant to arrow functions.

```js
const car = {
  wheels: 'four',
  yellWheels() {
    return this.wheels.toUpperCase();
  },
  countWheels: () => {
    return this.wheels;
  },
};

car.yellWheels(); // 'FOUR'
car.countWheels(); // undefined
```

Using the `function` keyword, `this` references the object. However, the arrow function doesn't get its own `this`. Therefore `wheels` is undefined because the global object doesn't have a property `wheels`.

To understand `this`, play [Eric Elliott's "What is this?"](https://medium.com/javascript-scene/what-is-this-the-inner-workings-of-javascript-objects-d397bfa0708a).

## 4. Implicit return

In the previous code snippet, we used the `return` keyword to return values from the functions. Nevertheless, arrow functions don't need to do that. If your function body is a single expression, you can omit the curly braces and the expression gets returned automatically.

```js
// These two functions do the same
const explicitReturn = () => {
  return 'foo';
};
const implicitReturn = () => 'foo';

explicitReturn(); // 'foo'
implicitReturn(); // 'foo'
```

Using implicit returns, we can simplify the examples from the syntax section.

```js
// Can't be simplified, no expression
const noop = () => {};

// Can be simplified, return expressions
const getName = (name = 'Anon') => name;
const double = n => n * 2;
const getNameProp = ({ name }) => name;
const add = (a, b) => a + b;
```

Implicit returns become especially handy for [currying](https://en.wikipedia.org/wiki/Currying), which is when a function returns another function until it returns its final value.

```js
const add = a => b => a + b; // add is a function that returns b => a + b
// Read this as const add = a => (b => a + b);
const inc = sum(1); // inc is a function because b => a + b got returned
const decr = sum(-1);

inc(3); // 4 because inc remembers a as 1
inc(6); // 7
decr(3); // 2 because decr remembers a as -1
```

`add` is a function that takes in `a` and returns a function that takes in `b` that returns the sum of `a` and `b`. The function that takes in `b` remembers `a` in its closure.

If you liked this article, you might also like ["Understanding Conditional Rendering in React"](https://geromekevin.com/understanding-conditional-rendering-in-react/) because we explore `||` and `&&` in it in-depth.

## Summary

We understood the 4 differences between the `function` keyword and an arrow function.
