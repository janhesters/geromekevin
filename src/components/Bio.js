import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { author, social } = data.site.siteMetadata
        return (
          <div style={{
            marginBottom: rhythm(2),
          }}>
            <div
              style={{
                display: `flex`,
              }}
            >
              <Image
                fixed={data.avatar.childImageSharp.fixed}
                alt={author}
                style={{
                  marginRight: rhythm(1 / 2),
                  marginBottom: 0,
                  width: rhythm(2),
                  height: rhythm(2),
                  borderRadius: `100%`,
                }}
                imgStyle={{
                  borderRadius: `50%`,
                }}
              />
              <p>
                Personal blog by{" "}
                <a href={`https://twitter.com/${social.twitter}`}>
                  Jan Hesters
                </a>
                .
                <br />
                Ask better questions.
              </p>
            </div>
            <p>Want to contact me? Send me an email <a href="mailto:jan.hesters@coderemail.com?subject=JavaScript&body=Hi Jan,"></a>.</p>
          </div>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/jan.jpg/" }) {
      childImageSharp {
        fixed(width: 50, height: 50) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        social {
          twitter
        }
      }
    }
  }
`

export default Bio
