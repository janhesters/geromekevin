---
title: Unit Testing React Native Components the RITE Way
date: '2019-04-26'
description: Use a little helper function.
---

## RITEway-Jest

If you want to use RITEway with React Native, check out [RITEway-Jest](https://github.com/janhesters/riteway-jest). This blog post is outdated and RITEway-Jest is the superior solution.

---

In the next minute, you are going to learn **how to use a RITEway inspired API in Jest unit tests for React Native.**

---

The best unit testing library (because its tests answer [the five questions every unit test must answer](https://medium.com/javascript-scene/rethinking-unit-test-assertions-55f59358253f)) [RITEway](https://github.com/ericelliott/riteway) is unavailable for React Native components. RITEway doesn't mock the native modules [like Jest does](https://github.com/facebook/react-native/blob/master/jest/setup.js).

What if you still want to write [unit tests for React components](https://medium.com/javascript-scene/unit-testing-react-components-aeda9a44aae2) that always supply a good bug report when they fail? You are going to learn a simple trick to write RITE test assertions for React Native using Jest.

We can wrap Jest's `test`, or `it` function in a helper and export it. Create a file `assert.js` in the root of your project adjacent to `package.json`.

```js
const assert = ({
  given = undefined,
  should = '',
  actual = undefined,
  expected = undefined,
} = {}) => {
  it(`given ${given}: should ${should}`, () => {
    expect(actual).toEqual(expected);
  });
};

export default assert;
```

That's already it. 👌🏻

You can now use it in your tests like this:

```js
import React from 'react';
import { View, Text } from 'react-native';
import { render } from 'react-native-testing-library';
// Or
// import { render } from 'native-testing-library';

import assert from '../assert';

function ClickCounter({ clicks }) {
  return (
    <View>
      <Text testID="clicks-count">{clicks}</Text>
    </View>
  );
}

describe('ClickCounter component', () => {
  const createCounter = clickCount =>
    render(<ClickCounter clicks={clickCount} />).getByTestId;

  {
    const count = 3;
    const $ = createCounter(count);
    assert({
      given: 'a click count',
      should: 'render the correct number of clicks.',
      actual: parseInt($('clicks-count').props.children, 10),
      expected: count,
    });
  }

  {
    const count = 5;
    const $ = createCounter(count);
    assert({
      given: 'a click count',
      should: 'render the correct number of clicks.',
      actual: parseInt($('clicks-count').props.children, 10),
      expected: count,
    });
  }
});
```

**Note about RITEway:** Aside from forcing you to write meaningful unit tests, RITEway's genius API additionally makes it hard to use mocks. The consequence of this is that you avoid mocking. Now, when you write unit tests stick to only testing your pure logic and test your side-effects with E2E tests because [mocking is a code smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a). I recommend using [Detox](https://github.com/wix/Detox) for React Native.
