import 'server-only'

/**
 * The dataset is private, so every read is authenticated. Importing this
 * module from a client component is a build error, which is the point.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN

if (!readToken) {
  throw new Error('Missing environment variable: SANITY_API_READ_TOKEN')
}
