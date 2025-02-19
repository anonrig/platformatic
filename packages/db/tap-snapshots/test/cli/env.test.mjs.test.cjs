/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports['test/cli/env.test.mjs TAP env white list schema > must match snapshot 1'] = `
type Query {
  getPageById(id: ID!): Page
  pages(limit: Int, offset: Int, orderBy: [PageOrderByArguments], where: PageWhereArguments): [Page]
  countPages(where: PageWhereArguments): pagesCount
}

type Page {
  id: ID
  title: String
}

input PageOrderByArguments {
  field: PageOrderByField
  direction: OrderByDirection!
}

enum PageOrderByField {
  id
  title
}

enum OrderByDirection {
  ASC
  DESC
}

input PageWhereArguments {
  id: PageWhereArgumentsid
  title: PageWhereArgumentstitle
}

input PageWhereArgumentsid {
  eq: ID
  neq: ID
  gt: ID
  gte: ID
  lt: ID
  lte: ID
  in: [ID]
  nin: [ID]
}

input PageWhereArgumentstitle {
  eq: String
  neq: String
  gt: String
  gte: String
  lt: String
  lte: String
  in: [String]
  nin: [String]
}

type pagesCount {
  total: Int
}

type Mutation {
  savePage(input: PageInput!): Page
  insertPages(inputs: [PageInput]!): [Page]
  deletePages(where: PageWhereArguments): [Page]
}

input PageInput {
  id: ID
  title: String
}
`
