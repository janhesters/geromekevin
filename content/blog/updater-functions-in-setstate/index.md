---
title: Updater Functions in React's setState
date: '2019-04-05'
description: Once you learn this, you'll understand setState better.
---

I recently learned a little nugget about **how functions in `setState` work**.

![Now I begin to see … 💡](./ideaBulb.jpg)

This article is for you if you are unaware of the differences between these lines (especially between 3 and 5):

```js
this.setState({ on: !this.state.on });
// ,
this.setState(prevState => ({ ...prevState, on: !prevState.on }));
// , or
this.setState(({ on }) => ({ on: !on }));
// 🤔
```

---

I learned (and I'm still learning) React using video lectures. In most courses about React I watched the instructor updating state like this:

```jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

const styles = {
  container: {
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

class StateExample extends Component {
  state = { on: false };

  toggleLight = () => {
    this.setState({ on: !this.state.on });
  };

  render() {
    const { on } = this.state;
    return (
      <div style={styles.container}>
        The light is on {`The light is ${on ? 'on💡' : 'off 🌃'}`}
        <button onClick={this.toggleLight}>Toggle light</button>
      </div>
    );
  }
}

const rootElement = document.getElementById('root');
ReactDOM.render(<StateExample />, rootElement);
```

Notice how `setState` gets an object as its parameter. This is okay for most state. However, in this example the next value of `this.state.on` depends on the current value of `this.state.on`.

The [recommended way](https://twitter.com/dan_abramov/status/816394376817635329) of updating `state` in React based on previous state is using updater functions instead of objects. I first read this in [“Using a function in setState instead of an object”](https://medium.com/@wisecobbler/using-a-function-in-setstate-instead-of-an-object-1f5cfd6e55d1) by [Sophia](https://medium.com/@wisecobbler), which is a great article 👏🏻.

Consequently, for months I’ve been updating state which depends on previous state, using **a function and the `prevState` parameter**.

```js
this.setState(prevState => ({ ...prevState, on: !prevState.on }));
```

This always worked for me and I haven’t run into any problems. Then [I watched Kent C. Dodds](https://egghead.io/lessons/react-build-a-toggle-component-6bdfaade) using **a function in `setState` in conjunction with destructuring**.

```js
this.setState(({ on }) => ({ on: !on }));
```

**What is the different between these two?** I experimented with both, and I couldn’t discover a difference.

It turns out it comes down to the inner workings of React. [**`setState` calls**](https://github.com/facebook/react/blob/master/packages/react/src/ReactBaseClasses.js#L66) another function called [**`enqueueSetState`**](https://github.com/facebook/react/blob/144328fe81719e916b946e22660479e31561bb0b/packages/react-test-renderer/src/ReactShallowRenderer.js#L62).

```js
// In react/src/ReactBaseClasses.js
Component.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  // Here enqueueSetState is called.
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

// In react/packages/react-test-renderer/src/ReactShallowRenderer.js
enqueueSetState(publicInstance, partialState, callback, callerName) {
  this._enqueueCallback(callback, publicInstance);
  const currentState = this._renderer._newState || publicInstance.state;

  if (typeof partialState === 'function') {
    partialState = partialState.call(
      publicInstance,
      currentState,
      publicInstance.props,
    );
  }

  // Null and undefined are treated as no-ops.
  if (partialState === null || partialState === undefined) {
    return;
  }

  this._renderer._newState = {
    ...currentState,
    ...partialState,
  };

  this._renderer.render(this._renderer._element, this._renderer._context);
}
```

As you can see here, **`currentState` and `partialState` are being spread out**. Or as [the docs](https://reactjs.org/docs/state-and-lifecycle.html#state-updates-are-merged) put it:

> “State Updates are Merged”

It follows that using `prevState` always results in

```js
state = {
  ...prevState,
  ...{ ...prevState, expanded: !prevState.expanded },
};
```

, whereas Kent’s way of destructuring state results in

```js
state = { ...prevState, { expanded: !expanded } };
```

, which is arguably better.

**One more thing:** You can see the benefits of destructuring the state even more if you have nested objects in your state.

```js
state = { nested: { on: false, hangingFromCeiling: true } };

this.setState(({ nested }) = ({ nested: { ...nested, on: !on } }));
```

Here we keep our light bulb hanging from the ceiling by destructuring and spreading out the nested key.

I hope you either always avoided this stupid mistake or you learned as much as I did here 🎓.
