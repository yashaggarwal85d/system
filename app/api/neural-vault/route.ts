import { NextResponse } from "next/server";

const REPO_OWNER = "yashaggarwal85d";
const REPO_NAME = "Neural-Vault";
// Using a token is recommended for higher rate limits, but not strictly necessary for public repos
const GITHUB_TOKEN = process.env.GITHUB_PAT; // Optional: Add your GitHub PAT to .env for higher rate limits

const headers: HeadersInit = {
  Accept: "application/vnd.github.v3+json",
};
if (GITHUB_TOKEN) {
  headers["Authorization"] = `token ${GITHUB_TOKEN}`;
}

interface GitHubFile {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubFile[];
  truncated: boolean;
}

export async function GET() {
  try {
    // 1. Get the default branch name (optional, often 'main' or 'master', but good practice to check)
    // For simplicity, we'll assume 'main'. If needed, fetch repo details first:
    // const repoDetailsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
    // const repoDetailsRes = await fetch(repoDetailsUrl, { headers });
    // const repoDetails = await repoDetailsRes.json();
    // const defaultBranch = repoDetails.default_branch;
    const defaultBranch = "main"; // Assuming default branch is 'main'

    // 2. Get the tree SHA for the default branch (using the Trees API recursively)
    // The recursive flag gets all files in one go
    const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers });

    if (!treeRes.ok) {
      console.error("GitHub API Error (tree):", await treeRes.text());
      throw new Error(`Failed to fetch repository tree: ${treeRes.statusText}`);
    }

    const treeData: GitHubTree = await treeRes.json();

    // 3. Filter for Markdown files within the specified directories
    const allowedDirs = ["Books/", "Internet/", "Misc/"];
    const mdFiles = treeData.tree.filter(
      (item) =>
        item.type === "blob" &&
        item.path.endsWith(".md") &&
        allowedDirs.some((dir) => item.path.startsWith(dir))
    );

    if (mdFiles.length === 0) {
      return NextResponse.json(
        {
          error: `No Markdown files found in the specified directories (${allowedDirs.join(
            ", "
          )}) within the repository.`,
        },
        { status: 404 }
      );
    }

    // 4. Select a random Markdown file
    const randomIndex = Math.floor(Math.random() * mdFiles.length);
    const randomFile = mdFiles[randomIndex];

    // 5. Construct the raw content URL
    const fileContentUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${defaultBranch}/${randomFile.path}`;

    // 6. Fetch the raw content
    const contentRes = await fetch(fileContentUrl); // No special headers needed for raw download

    if (!contentRes.ok) {
      console.error(
        "GitHub API Error (raw file content):",
        await contentRes.text()
      );
      throw new Error(
        `Failed to fetch file content for ${randomFile.path}: ${contentRes.statusText}`
      );
    }

    const markdownContent = await contentRes.text();

    // 7. Return the content and the full path as fileName
    return NextResponse.json({
      fileName: randomFile.path, // Use the full path as the identifier
      content: markdownContent,
    });
  } catch (error) {
    console.error("Error fetching from Neural Vault:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to fetch data from Neural Vault.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
