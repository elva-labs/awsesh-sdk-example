import { awsesh } from "./lib"

const args = process.argv.slice(2)
const sessionName = args[0]

async function listAccounts() {
  const sessions = await awsesh.sessions.list()
  
  if (sessions.length === 0) {
    console.log("No sessions found. Run 'bun run login' first.")
    process.exit(1)
  }
  
  let session = sessions[0]
  
  if (sessionName) {
    const found = sessions.find(s => s.name === sessionName)
    if (!found) {
      console.error(`Session '${sessionName}' not found`)
      process.exit(1)
    }
    session = found
  } else if (sessions.length > 1) {
    console.log("Multiple sessions found. Specify one:")
    for (const s of sessions) {
      console.log(`  bun run list-accounts ${s.name}`)
    }
    console.log("")
    console.log(`Using first session: ${session.name}`)
  }
  
  console.log(`\nAccounts for session: ${session.name}\n`)
  
  const tokenCache = await awsesh.tokens.get(session.startUrl)
  if (!tokenCache || !awsesh.tokens.isValid(tokenCache)) {
    console.log("Not authenticated. Run 'bun run login' first.")
    process.exit(1)
  }
  
  const cached = await awsesh.accounts.get(session.name)
  let accounts = cached?.accounts || []
  
  if (accounts.length === 0 || args.includes("--refresh")) {
    console.log("Fetching accounts from AWS...")
    accounts = await awsesh.sso.listAccounts(session, tokenCache.token)
    await awsesh.accounts.save(session.name, {
      accounts,
      lastUpdated: Date.now(),
    })
  }
  
  console.log(`Found ${accounts.length} account(s):\n`)
  
  for (const account of accounts) {
    console.log(`${account.name} (${account.accountId})`)
    
    if (!account.rolesLoaded || account.roles.length === 0) {
      const roles = await awsesh.sso.listRoles(session, tokenCache.token, account.accountId)
      account.roles = roles
      account.rolesLoaded = true
    }
    
    for (const role of account.roles) {
      console.log(`  - ${role}`)
    }
    console.log("")
  }
  
  await awsesh.accounts.save(session.name, {
    accounts,
    lastUpdated: Date.now(),
  })
}

await listAccounts()
