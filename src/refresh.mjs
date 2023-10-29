import fsp from "fs/promises";
import fs from "fs";
import fetch from "node-fetch";
async function main() {
  const repos = JSON.parse(await fsp.readFile("./assets/repos.json", "utf8")).ThirdRepoList.$values.map((repo) => repo.Url);
  const promises = repos.map((repo) => fetch(repo).then((res) => res.json()));
  const reposData = await Promise.all(promises.map((p) => p.catch((e) => e)));
  for (const repoData of reposData) {
    if (repoData instanceof Error) {
      console.error(repoData);
      continue;
    }
    for (const pluginInfo of repoData) {
      const version = pluginInfo.AssemblyVersion;
      const name = pluginInfo.Name;
      const internalName = pluginInfo.InternalName;
      const url = pluginInfo.DownloadLinkInstall;
      fsp.mkdir(`./plugins/${internalName}`, { recursive: true });
      if (fs.existsSync(`./plugins/${internalName}/${version}.zip`)) continue;
      await fetch(url)
        .then((res) => res.buffer())
        .then((buffer) => fsp.writeFile(`./plugins/${internalName}/${version}.zip`, buffer))
        .then(() => fsp.writeFile(`./plugins/${internalName}/${version}.json`, JSON.stringify(pluginInfo)))
        .then(() => fsp.writeFile(`./plugins/${internalName}/latest.json`, JSON.stringify(pluginInfo)))
        .catch((e) => console.error(e));
      console.log(`Downloaded ${name} ${version}`);
    }
  }
}
main();
