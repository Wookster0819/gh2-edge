/**
 * GitHub connector helper
 * Uses the Replit connectors SDK — tokens are managed automatically.
 */
import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

/**
 * Fetch a list of repos for the authenticated user.
 * @param {object} opts
 * @param {number} opts.perPage  - results per page (default 30)
 * @param {string} opts.sort     - "updated" | "pushed" | "created" | "full_name"
 */
export async function listMyRepos({ perPage = 30, sort = "updated" } = {}) {
  const res = await connectors.proxy(
    "github",
    `/user/repos?per_page=${perPage}&sort=${sort}`,
    { method: "GET" }
  );
  return res.json();
}

/**
 * Fetch metadata for a single repo.
 * @param {string} owner
 * @param {string} repo
 */
export async function getRepo(owner, repo) {
  const res = await connectors.proxy("github", `/repos/${owner}/${repo}`, {
    method: "GET",
  });
  return res.json();
}

/**
 * Fetch the contents of a file or directory within a repo.
 * @param {string} owner
 * @param {string} repo
 * @param {string} path  - path inside the repo (e.g. "README.md")
 * @param {string} ref   - branch / tag / commit (default: repo default branch)
 */
export async function getContents(owner, repo, path = "", ref = "") {
  const qs = ref ? `?ref=${ref}` : "";
  const res = await connectors.proxy(
    "github",
    `/repos/${owner}/${repo}/contents/${path}${qs}`,
    { method: "GET" }
  );
  return res.json();
}

/**
 * Decode a base64-encoded file returned by the GitHub contents API.
 * @param {object} fileObj - the object returned by getContents() for a single file
 * @returns {string} decoded UTF-8 text
 */
export function decodeFileContent(fileObj) {
  if (fileObj.encoding !== "base64") return fileObj.content;
  return Buffer.from(fileObj.content, "base64").toString("utf8");
}
