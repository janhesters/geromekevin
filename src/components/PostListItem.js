import React from 'react';
import { Link } from 'gatsby';

import { formatReadingTime } from '../utils/helpers';
import { rhythm } from '../utils/typography';

function PostListItem({
  node,
  title = node.frontmatter.title || node.fields.slug,
}) {
  return (
    <div key={node.fields.slug}>
      <h3
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: rhythm(1),
          marginBottom: rhythm(1 / 4),
        }}
      >
        <Link
          style={{ boxShadow: `none` }}
          to={node.fields.slug}
          rel="bookmark"
        >
          {title}
        </Link>
      </h3>
      <small>
        {node.frontmatter.date}{' '}
        {` • ${formatReadingTime(node.timeToRead)}`}
      </small>
      <p
        dangerouslySetInnerHTML={{
          __html: node.frontmatter.description || node.excerpt,
        }}
      />
    </div>
  );
}

export default PostListItem;
