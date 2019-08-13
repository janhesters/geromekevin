import React from 'react';

import { rhythm } from '../utils/typography';

class Footer extends React.Component {
  render() {
    return (
      <footer
        style={{
          marginTop: rhythm(2.5),
          paddingTop: rhythm(1),
        }}
      >
        <a
          href="https://mobile.twitter.com/janhesters"
          target="_blank"
          rel="noopener noreferrer"
        >
          twitter
        </a>{' '}
        &bull;{' '}
        <a
          href="https://www.instagram.com/janhesters/"
          target="_blank"
          rel="noopener noreferrer"
        >
          instagram
        </a>{' '}
      </footer>
    );
  }
}

export default Footer;
