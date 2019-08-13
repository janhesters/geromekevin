import React from 'react';
import { Link, graphql } from 'gatsby';
import Layout from '../components/Layout';
import Bio from '../components/Bio';
import SEO from '../components/Seo';
import PostListItem from '../components/PostListItem';
import { rhythm } from '../utils/typography';
import { primaryColor } from '../style';

function Tags({ pageContext, data, location }) {
  const { tag } = pageContext;
  const { edges: posts, totalCount } = data.allMarkdownRemark;
  const siteTitle = data.site.siteMetadata.title;
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? '' : 's'
    } tagged with "${tag}"`;

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title={`All posts tagged "${tag}"`} />
      <h1>{tagHeader}</h1>
      <main>
        {posts.map(({ node }) => (
          <PostListItem node={node} />
        ))}
      </main>
      <footer>
        <h3
          style={{
            fontFamily: 'Montserrat, sans-serif',
            marginTop: rhythm(0.25),
          }}
        >
          <Link
            style={{
              boxShadow: 'none',
              textDecoration: 'none',
              color: primaryColor,
            }}
            to={'/'}
          >
            Jan Hesters
          </Link>
        </h3>
        <Bio />
        <nav>
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-between`,
              listStyle: `none`,
              padding: 0,
            }}
          >
            <li>
              <Link to="/tags" rel="index">
                All tags
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </Layout>
  );
}

export default Tags;

export const pageQuery = graphql`
  query($tag: String) {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          excerpt
          fields {
            slug
          }
          timeToRead
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
            tags
          }
        }
      }
    }
  }
`;
