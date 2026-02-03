import "dotenv/config";
import {
    ver,
    buildDist,
    buildImage,
    checkDocker,
    checkTagExists,
    checkVersionFormat,
    getRepoNames,
    execSync,
    checkReleaseBranch,
    createDistTarGz,
    createReleasePR,
} from "./lib.mjs";
import semver from "semver";

const repoNames = getRepoNames();
const version = process.env.RELEASE_BETA_VERSION;
const dryRun = process.env.DRY_RUN === "true";
const previousVersion = process.env.RELEASE_PREVIOUS_VERSION;
const branchName = `release-${version}`;
const githubRunId = process.env.GITHUB_RUN_ID;

if (dryRun) {
    console.log("Dry run mode enabled. No images will be pushed.");
}

console.log("RELEASE_BETA_VERSION:", version);

// Check if the current branch is "release-{version}"
checkReleaseBranch(branchName);

// Check if the version is a valid semver
checkVersionFormat(version);

// Check if there is a prerelease identifier (e.g., beta, sso, rc)
const semverIdentifier = semver.prerelease(version);
console.log("Semver identifier:", semverIdentifier);
if (!semverIdentifier || semverIdentifier.length === 0) {
    console.error("VERSION should have a prerelease identifier (e.g., 2.2.0-beta.1, 2.2.0-sso)");
    process.exit(1);
}
const prereleaseType = semverIdentifier[0];
console.log("Prerelease type:", prereleaseType);

// Check if docker is running
checkDocker();

// Check if the tag exists
await checkTagExists(repoNames, version);

// node extra/beta/update-version.js
await import("../beta/update-version.mjs");

// Create Pull Request (gh pr create will handle pushing the branch)
await createReleasePR(version, previousVersion, dryRun, branchName, githubRunId);

// Build frontend dist
buildDist();

if (!dryRun) {
    // Build slim image (rootless)
    buildImage(
        repoNames,
        [`${prereleaseType}-slim-rootless`, ver(version, "slim-rootless")],
        "rootless",
        "BASE_IMAGE=ghcr.io/arnica-internal/uptime-kuma:base2-slim"
    );

    // Build full image (rootless)
    buildImage(repoNames, [`${prereleaseType}-rootless`, ver(version, "rootless")], "rootless");

    // Build slim image
    buildImage(repoNames, [`${prereleaseType}-slim`, ver(version, "slim")], "release", "BASE_IMAGE=ghcr.io/arnica-internal/uptime-kuma:base2-slim");

    // Build full image
    buildImage(repoNames, [prereleaseType, version], "release");
} else {
    console.log("Dry run mode - skipping image build and push.");
}

// Create dist.tar.gz
await createDistTarGz();
