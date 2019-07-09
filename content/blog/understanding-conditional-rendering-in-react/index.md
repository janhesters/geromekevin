---
title: Understanding Conditional Rendering in React
date: '2019-07-02'
description: You need to understand the selector operators.
---

`||` and `&&` (often) don't return booleans. They behave differently than you might think. Do you use them for conditional rendering in React? In this article, you are going to learn what's going on.

---

If you have some experience with React, you have seen conditional rendering.

```jsx
function Parent({ renderChildren, children }) {
  return (
    <>
      <p>{renderChildren || children}</p>
      <p>{renderChildren && children}</p>
    </>
  );
}
```

Here we use `||` and `&&`. If you're thinking "Boring, I can predict what happens." you might be right. But unless you can explain why [Kyle Simpson](https://twitter.com/getify) calls `||` and `&&` "operand selector operators", you probably don't understand what's really going on here. The weird thing about operand selector operators is that you can use them without understanding them and they still do the correct thing most of the time.

What threw me off, is that I had an adjacent case using `&&`, where `renderChildren` was `0`. To my surprise, the `0` got rendered, even though it's [falsy](https://developer.mozilla.org/de/docs/Glossary/Falsy). But when `children` was `0` and `||` was used, nothing was rendered even though `renderChildren` was `true`.

Let's have a little test. What is being returned here?

```js
// Example 1
true && true;
true && false;
false && true;
false && false;

true || true;
true || false;
false || true;
false || false;
```

Easy enough, right?

```js
true && true; // true
true && false; // false
false && true; // false
false && false; // false

true || true; // true
true || false; // true
false || true; // true
false || false; // false
```

What about this?

```js
// Example 2
1 || 'foo';
0 || 'foo';
1 && 'foo';
0 && 'foo';
```

Did you guess this?

```js
1 || 'foo'; // true 🔴
0 || 'foo'; // true 🔴
1 && 'foo'; // true 🔴
0 && 'foo'; // false 🔴
```

Wrong. `||` and `&&` do not return boolean values (unless you use them with `true` or `false` as in example one).

What's really being returned is this.

```js
1 || 'foo'; // 1 ✅
0 || 'foo'; // "foo" ✅
1 && 'foo'; // "foo" ✅
0 && 'foo'; // 0 ✅
```

This means `||` and `&&` return one of their operands - they "select" one, hence the name operand selector operators.

`||` checks if the first operand is truthy using [`ToBoolean`](https://www.ecma-international.org/ecma-262/5.1/#sec-9.2). If yes it returns the first operand, otherwise the second.

`&&` works the exact opposite way. If its first operand is truthy, it returns the second, otherwise the first.

If you use operand selector operators in an `if` statement, for example, they only work as you expect because of [implicit type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion). The `if` statement also invokes `ToBoolean` on the primitive inside its brackets.

We also have to know which [primitives](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures) React renders to understand conditional rendering.

```jsx
function Example() {
  return (
    <>
      {true}
      {false}
      {null}
      {undefined}
      {0}
      {1}
      {NaN}
      {''}
      {'foo'}
      {[]}
      {[null, 0, 1, 'foo']}
      {/* {{}} 🔴 Empty object isn't a valid React object.*/}
    </>
  );
}
```

If you try this code out in a [CodeSandbox](https://codesandbox.io/), you will see that only `0`, `1`, `NaN` and `"foo"` get rendered. This is also true for the value in the array. So the code above will render `01NaNfoo01foo`.

What's interesting to note here is that React doesn't go by whether a value is truthy or falsy to determine what should be rendered. If that where the case, `true` would've gotten rendered, but `0` and `NaN` not.

Test yourself: What is being rendered?

```jsx
function App() {
  return (
    <div className="App">
      <h3>Test 1</h3>
      <Parent renderChildren={false}>
        <p>Via Children.</p>
      </Parent>
      <h3>Test 2</h3>
      <Parent renderChildren={true}>
        <p>Via Children.</p>
      </Parent>
      <h3>Test 3</h3>
      <Parent renderChildren={true}>{null}</Parent>
      <h3>Test 4</h3>
      <Parent renderChildren={false}>{null}</Parent>
      <h3>Test 5</h3>
      <Parent renderChildren={0}>0</Parent>
      <h3>Test 6</h3>
      <Parent renderChildren={false}>0</Parent>
      <h3>Test 7</h3>
      <Parent renderChildren={true}>0</Parent>
    </div>
  );
}
```

Knowing how React renders primitives, and understanding `||` and `&&` it's clear to you now, why and when `0` gets rendered if you use it as `renderChildren` or `children`. Only Test 3 and Test 4 render nothing.

## More Quirks

Another gotcha with `||` and `&&` is [operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence). From mathematics you might know that `*` is always evaluated before any `+`.

```js
3 + 4 * 2; // 11, not 14
```

Similarly, `&&` is always evaluated before `||` if there are no explicit brackets.

Additionally, you also should know that the operand selector operators [short circuit](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators#Short-circuit_evaluation).

```js
function foo() {
  console.log('foo');
  return true;
}

function bar() {
  console.log('bar');
  return false;
}

foo() || bar(); // foo true
bar() || foo(); // bar foo true
```

In the first example, only `foo` is evaluated. In the second, both `bar` and `foo` are invoked because `bar` returns `false`, which is obviously `falsy`.

Aside from conditionally rendering React components, you can use `&&` to conditionally assign an optional key to an object using the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).

```js
const me = { name: { firstName: 'Jan', lastName: 'Hesters' }, age: 25 };
const anon = { age: 34 };

const getName = ({ name }) => ({ ...(name && name) });
const getNameWithDefault = ({ name }) => ({
  ...((name && { name }) || { name: 'Anonymous' }),
});

getName(me); // { firstName: "Jan", lastName: "Hesters" }
getName(anon); // {}
getNameWithDefault(me); // { name: { firstName: 'Jan', lastName: 'Hesters' } }
getNameWithDefault(anon); // { name: "Anonymous" }
```

Why use `&&` here? Without `&&`, `name` would explicitly be `undefined` when `getName` is called with `anon`.

```js
const getNameWithoutSpread = ({ name }) => ({ name });
const getName = ({ name }) => ({ ...(name && { name }) });

const anon = { age: 34 };

const foo = getNameWithoutSpread(anon); // {name: undefined}
const bar = getName(anon); // {}

foo.hasOwnProperty('name'); // true
bar.hasOwnProperty('name'); // false
```

If you liked this article you might also like ["useCallback vs. useMemo"](https://geromekevin.com/usecallback-vs-usememo/) where we explore the differences between the two Hooks or the more beginner friendly post: ["Understanding arrow functions."](https://geromekevin.com/understanding-arrow-functions)

## Summary

We explained how `||` and `&&` work, that they select their operands and the pitfalls you might encounter when using them. We also looked at how you can use them for conditional rendering in React and for conditionally assigning keys to objects.
