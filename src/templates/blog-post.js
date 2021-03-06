import React from 'react';
import { Link, graphql } from 'gatsby';
import kebabCase from 'lodash/kebabCase';

import Bio from '../components/Bio';
import Layout from '../components/Layout';
import SEO from '../components/Seo';
import SignUp from '../components/SignUp';
import { rhythm, scale } from '../utils/typography';
import { primaryColor } from '../style';
import { formatReadingTime } from '../utils/helpers';

const systemFont = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
    "Droid Sans", "Helvetica Neue", sans-serif`;
class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    const siteTitle = this.props.data.site.siteMetadata.title;
    const { previous, next } = this.props.pageContext;
    const tags = post.frontmatter.tags || [];

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
          slug={post.fields.slug}
        />
        <main>
          <article>
            <header>
              <h1>{post.frontmatter.title}</h1>
              <p
                style={{
                  ...scale(-1 / 5),
                  display: `block`,
                  marginBottom: 0,
                  marginTop: rhythm(-4 / 5),
                }}
              >
                {post.frontmatter.date}
                {` • ${formatReadingTime(post.timeToRead)}`}
              </p>
              {
                <ul
                  style={{
                    display: `flex`,
                    flexWrap: `wrap`,
                    justifyContent: `flex-start`,
                    listStyle: `none`,
                    padding: 0,
                    marginLeft: 0,
                  }}
                >
                  {tags.sort().map((tag, index) => (
                    <li key={tag} style={{ marginBottom: 0 }}>
                      <Link to={`/tags/${kebabCase(tag)}/`}>{tag}</Link>
                      {index === tags.length - 1 ? '' : ',\xa0'}
                    </li>
                  ))}
                </ul>
              }
            </header>
            <div dangerouslySetInnerHTML={{ __html: post.html }} />
          </article>
        </main>
        <footer>
          <div
            style={{
              margin: '90px 0 40px 0',
              fontFamily: systemFont,
            }}
          >
            <SignUp />
          </div>
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
                {previous && (
                  <Link to={previous.fields.slug} rel="prev">
                    ← {previous.frontmatter.title}
                  </Link>
                )}
              </li>
              <li>
                {next && (
                  <Link to={next.fields.slug} rel="next">
                    {next.frontmatter.title} →
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </footer>
      </Layout>
    );
  }
}

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      timeToRead
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        tags
      }
      fields {
        slug
      }
    }
  }
`;
