import { createAwsesh } from "@awsesh/core"
import os from "node:os"
import path from "node:path"

const homeDir = os.homedir()

export const awsesh = createAwsesh({
  configDir: path.join(homeDir, ".config", "awsesh"),
  dataDir: path.join(homeDir, ".local", "share", "awsesh"),
  awsDir: path.join(homeDir, ".aws"),
})
