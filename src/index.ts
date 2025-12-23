import { createAwsesh } from "@awsesh/core"
import os from "node:os"
import path from "node:path"

const homeDir = os.homedir()

const awsesh = createAwsesh({
  configDir: path.join(homeDir, ".config", "awsesh"),
  dataDir: path.join(homeDir, ".local", "share", "awsesh"),
  awsDir: path.join(homeDir, ".aws"),
})

console.log("@awsesh/core SDK initialized successfully!")
console.log("")
console.log("Available namespaces:")
console.log("  - awsesh.sessions      (SSO session management)")
console.log("  - awsesh.sso           (SSO authentication & AWS API)")
console.log("  - awsesh.tokens        (token cache management)")
console.log("  - awsesh.accounts      (account cache management)")
console.log("  - awsesh.credentials   (AWS credentials file)")
console.log("  - awsesh.lastSelected  (user preferences)")
console.log("  - awsesh.profileNames  (custom profile names)")
console.log("  - awsesh.preferredRoles (preferred role per account)")
console.log("  - awsesh.activeCredentials (track active credentials)")
console.log("")

const sessions = await awsesh.sessions.list()
console.log(`Found ${sessions.length} saved session(s)`)

if (sessions.length > 0) {
  console.log("")
  console.log("Sessions:")
  for (const session of sessions) {
    console.log(`  - ${session.name} (${session.startUrl})`)
  }
}

export { awsesh }
