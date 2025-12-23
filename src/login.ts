import type { SSOSession } from "@awsesh/core"
import { awsesh } from "./lib"

const args = process.argv.slice(2)

async function promptForSession(): Promise<SSOSession> {
  const sessions = await awsesh.sessions.list()
  
  if (sessions.length > 0 && !args.includes("--new")) {
    console.log("Existing sessions:")
    sessions.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`))
    console.log("")
    
    const input = prompt("Enter session number to login, or 'n' for new session:")
    
    if (input && input !== "n") {
      const index = Number.parseInt(input) - 1
      if (index >= 0 && index < sessions.length) {
        return sessions[index]
      }
    }
  }
  
  console.log("\nCreate new SSO session:\n")
  
  const name = prompt("Session name (e.g., 'my-org'):")
  const startUrl = prompt("SSO start URL (e.g., 'https://my-org.awsapps.com/start'):")
  const ssoRegion = prompt("SSO region (e.g., 'us-east-1'):") || "us-east-1"
  const defaultRegion = prompt("Default region (e.g., 'eu-west-1'):") || "eu-west-1"
  
  if (!name || !startUrl) {
    console.error("Name and start URL are required")
    process.exit(1)
  }
  
  const session: SSOSession = {
    name,
    startUrl,
    ssoRegion,
    defaultRegion,
  }
  
  await awsesh.sessions.save(session)
  console.log(`\nSession '${name}' saved.`)
  
  return session
}

async function login(session: SSOSession) {
  const existingToken = await awsesh.tokens.get(session.startUrl)
  if (existingToken && awsesh.tokens.isValid(existingToken)) {
    console.log(`\nAlready authenticated to ${session.name}`)
    console.log(`Token expires: ${existingToken.expiresAt}`)
    
    const reauth = prompt("\nRe-authenticate? (y/n):")
    if (reauth !== "y") {
      return
    }
  }
  
  console.log(`\nStarting login for ${session.name}...`)
  
  const loginInfo = await awsesh.sso.startLogin(session)
  
  console.log("")
  console.log("=".repeat(50))
  console.log("Open this URL in your browser:")
  console.log("")
  console.log(`  ${loginInfo.verificationUriComplete}`)
  console.log("")
  console.log(`Or go to: ${loginInfo.verificationUri}`)
  console.log(`And enter code: ${loginInfo.userCode}`)
  console.log("=".repeat(50))
  console.log("")
  console.log("Waiting for browser authorization...")
  
  let tokenResult = null
  const startTime = Date.now()
  const timeout = 5 * 60 * 1000
  
  while (!tokenResult) {
    if (Date.now() - startTime > timeout) {
      console.error("\nTimeout waiting for authorization")
      process.exit(1)
    }
    
    await new Promise(r => setTimeout(r, loginInfo.interval * 1000))
    process.stdout.write(".")
    
    tokenResult = await awsesh.sso.pollForToken(session, loginInfo)
  }
  
  console.log("\n\nAuthorization successful!")
  
  await awsesh.tokens.save(session.startUrl, tokenResult.token, tokenResult.expiresAt)
  console.log(`Token cached until ${tokenResult.expiresAt}`)
  
  console.log("\nFetching accounts...")
  const accounts = await awsesh.sso.listAccounts(session, tokenResult.token)
  console.log(`Found ${accounts.length} account(s)`)
  
  await awsesh.accounts.save(session.name, {
    accounts,
    lastUpdated: Date.now(),
  })
  
  console.log("\nLogin complete! Run 'bun run list-accounts' to see your accounts.")
}

const session = await promptForSession()
await login(session)
