import { awsesh } from "./lib"

console.log("Listing all SSO sessions...\n")

const sessions = await awsesh.sessions.list()

if (sessions.length === 0) {
  console.log("No sessions found.")
  console.log("")
  console.log("Run 'bun run login' to add a new session.")
} else {
  console.log(`Found ${sessions.length} session(s):\n`)
  
  for (const session of sessions) {
    const tokenCache = await awsesh.tokens.get(session.startUrl)
    const hasValidToken = tokenCache && awsesh.tokens.isValid(tokenCache)
    
    console.log(`Session: ${session.name}`)
    console.log(`  Start URL: ${session.startUrl}`)
    console.log(`  SSO Region: ${session.ssoRegion}`)
    console.log(`  Default Region: ${session.defaultRegion}`)
    console.log(`  Auth Status: ${hasValidToken ? "Authenticated" : "Not authenticated"}`)
    if (hasValidToken && tokenCache) {
      console.log(`  Token Expires: ${tokenCache.expiresAt}`)
    }
    console.log("")
  }
}
