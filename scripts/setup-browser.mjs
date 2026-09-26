import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const version = "154.0.8037.57";
const tools = fileURLToPath(new URL("../.hoplite/tools/", import.meta.url));
const target = join(tools, `chrome-for-testing-${version}`);
const executable = join(target, "chrome-linux64/chrome");

if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error("The headless verification browser requires Linux x64.");
}

try {
  await access(executable, constants.X_OK);
  const installed = execFileSync(executable, ["--version"], { encoding: "utf8" });
  if (installed.includes(version)) {
    console.log(`Verification browser is ready: ${installed.trim()}`);
    process.exit(0);
  }
} catch {}

await mkdir(tools, { recursive: true });
const temporary = await mkdtemp(join(tools, ".chrome-download-"));
try {
  const archive = join(temporary, "chrome.zip");
  const response = await fetch(
    `https://storage.googleapis.com/chrome-for-testing-public/${version}/linux64/chrome-linux64.zip`,
    { signal: AbortSignal.timeout(180_000) },
  );
  if (!response.ok) throw new Error(`Chrome download failed: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
  execFileSync("python3", ["-c", `
import os, pathlib, sys, zipfile
destination = pathlib.Path(sys.argv[2])
with zipfile.ZipFile(sys.argv[1]) as archive:
    for info in archive.infolist():
        path = pathlib.PurePosixPath(info.filename)
        if path.is_absolute() or '..' in path.parts:
            raise ValueError('Unsafe browser archive path')
    archive.extractall(destination)
    for info in archive.infolist():
        mode = (info.external_attr >> 16) & 0o777
        if mode:
            os.chmod(destination / info.filename, mode)
`, archive, temporary]);
  execFileSync(join(temporary, "chrome-linux64/chrome"), ["--version"]);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await rename(join(temporary, "chrome-linux64"), join(target, "chrome-linux64"));
  console.log(`Installed verification browser: Chrome for Testing ${version}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
