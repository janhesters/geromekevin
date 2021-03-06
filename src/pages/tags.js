import React from 'react';
import kebabCase from 'lodash/kebabCase';
import { Link, graphql } from 'gatsby';

import Layout from '../components/Layout';
import SEO from '../components/Seo';

function TagsPage({
  data: {
    allMarkdownRemark: { group },
    site: {
      siteMetadata: { title },
    },
  },
  location,
}) {
  return (
    <Layout location={location} title={title}>
      <SEO title="All tags" />
      <div>
        <h1>All Tags</h1>
        <ul>
          {group.map(tag => (
            <li key={tag.fieldValue}>
              <Link to={`/tags/${kebabCase(tag.fieldValue)}/`}>
                {tag.fieldValue} ({tag.totalCount})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}

export default TagsPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(limit: 2000) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;
