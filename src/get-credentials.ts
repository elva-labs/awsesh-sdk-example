import { awsesh } from "./lib"

const args = process.argv.slice(2)

async function getCredentials() {
  const sessions = await awsesh.sessions.list()
  
  if (sessions.length === 0) {
    console.log("No sessions found. Run 'bun run login' first.")
    process.exit(1)
  }
  
  const session = sessions[0]
  console.log(`Using session: ${session.name}\n`)
  
  const tokenCache = await awsesh.tokens.get(session.startUrl)
  if (!tokenCache || !awsesh.tokens.isValid(tokenCache)) {
    console.log("Not authenticated. Run 'bun run login' first.")
    process.exit(1)
  }
  
  const cached = await awsesh.accounts.get(session.name)
  if (!cached || cached.accounts.length === 0) {
    console.log("No accounts cached. Run 'bun run list-accounts' first.")
    process.exit(1)
  }
  
  const accountArg = args[0]
  const roleName = args[1]
  const profileName = args[2] || "default"
  
  if (!accountArg || !roleName) {
    console.log("Usage: bun run get-credentials <account-id> <role-name> [profile-name]")
    console.log("")
    console.log("Available accounts:")
    for (const account of cached.accounts) {
      console.log(`  ${account.accountId} - ${account.name}`)
      if (account.roles.length > 0) {
        console.log(`    Roles: ${account.roles.join(", ")}`)
      }
    }
    process.exit(1)
  }
  
  const account = cached.accounts.find(a => a.accountId === accountArg || a.name.toLowerCase().includes(accountArg.toLowerCase()))
  if (!account) {
    console.error(`Account '${accountArg}' not found`)
    process.exit(1)
  }
  
  const accountId = account.accountId
  
  console.log("Getting credentials for:")
  console.log(`  Account: ${account.name} (${accountId})`)
  console.log(`  Role: ${roleName}`)
  console.log(`  Profile: ${profileName}`)
  console.log("")
  
  const creds = await awsesh.sso.getCredentials(session, tokenCache.token, accountId, roleName)
  
  console.log("Credentials received:")
  console.log(`  Access Key ID: ${creds.accessKeyId.slice(0, 8)}...`)
  console.log(`  Expires: ${creds.expiration}`)
  console.log("")
  
  await awsesh.credentials.write(profileName, creds, session.defaultRegion)
  console.log(`Credentials written to ~/.aws/credentials [${profileName}]`)
  
  await awsesh.activeCredentials.save({
    profileName,
    accountId,
    accountName: account.name,
    roleName,
    sessionName: session.name,
    expiration: creds.expiration.toISOString(),
    isDefault: profileName === "default",
  })
  
  console.log("")
  console.log("You can now use AWS CLI:")
  if (profileName === "default") {
    console.log("  aws sts get-caller-identity")
  } else {
    console.log(`  aws sts get-caller-identity --profile ${profileName}`)
  }
}

await getCredentials()
