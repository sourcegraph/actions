/**
 * @file This file is written in plain JavaScript to remove an extra build step, but we should use the @ts-check
 * directive and JSDoc comments to make sure the logic is still type-safe.
 *
 * @todo 2026-09-10 - This file recreates local versions of the `AsyncFunctionArguments` type from
 * `@actions/github-script`.so that we can keep this file fully self-contained and type-safe without having to bring in
 * typical JS/TS tooling. If this repo gets to the point where it needs multiple JS scripts, consider ripping out these
 * local types in favor of bringing in the package straight from GitHub.
 */
//@ts-check

/** @type {{log: (...args: unknown[]) => void}} */
const console = /** @type {any} */ (globalThis).console

/**
 * @typedef {object} PullRequest
 * @property {number} number
 * @property {"open" | "closed"} state
 * @property {boolean} merged
 * @property {string} merge_commit_sha
 * @property {{ref: string, sha: string}} base
 * @property {{ref: string, sha: string}} head
 */

/**
 * @typedef {object} Context
 * @property {{pull_request?: PullRequest}} payload
 * @property {{owner: string, repo: string}} repo
 * @property {string} serverUrl
 */

/**
 * @typedef {object} Comment
 * @property {number} id
 * @property {string | null | undefined} body
 */

/**
 * @typedef {object} Github
 * @property {object} rest
 * @property {object} rest.pulls
 * @property {(params: {owner: string, repo: string, pull_number: number}) => Promise<{data: PullRequest}>} rest.pulls.get
 * @property {object} rest.issues
 * @property {(params: {owner: string, repo: string, issue_number: number}) => Promise<{data: Comment[]}>} rest.issues.listComments
 * @property {(params: {owner: string, repo: string, comment_id: number, body: string}) => Promise<unknown>} rest.issues.updateComment
 * @property {(params: {owner: string, repo: string, issue_number: number, body: string}) => Promise<unknown>} rest.issues.createComment
 */

/**
 * @typedef {object} GenerateTourLinkArgs
 * @property {Github} github
 * @property {Context} context
 */

const instance = "https://sourcegraph.sourcegraph.com"
// Hidden HTML comment embedded in the PR comment body, so re-runs can find and
// update the comment this action posted earlier instead of adding a new one.
const diffTourCommentMarker = "<!-- difftour-link -->"

/** @param {GenerateTourLinkArgs} args */
async function generateTourLink({ github, context }) {
	const pullRequestNumber = context.payload.pull_request?.number
	if (pullRequestNumber === undefined) {
		return
	}

	const { repo, owner } = context.repo
	// Fetch the PR rather than trusting the webhook payload: the payload can be
	// stale if the base was retargeted or the head force-pushed concurrently.
	const { data: pullRequest } = await github.rest.pulls.get({
		owner,
		repo,
		pull_number: pullRequestNumber,
	})

	/** @type {string} */
	let url
	// Sourcegraph's /r/<name> route looks the name up literally, and repos are
	// named by their full code host path, e.g. github.com/sourcegraph/docs.
	// serverUrl is GITHUB_SERVER_URL, so this also works on GitHub Enterprise.
	const codeHost = new URL(context.serverUrl).host
	const repoLink = `${codeHost}/${owner}/${repo}`
	if (pullRequest.merged) {
		// The head branch is usually deleted after merge, so a branch compare
		// link would break. Link the merge commit instead; it's permanent.
		const commit = encodeURIComponent(pullRequest.merge_commit_sha)
		url = `${instance}/r/${repoLink}/-/commit/${commit}?mode=Tour`
	} else {
		// Compare base...head. Both must resolve in this repo, which is why the
		// workflow `if:` skips fork PRs.
		//
		// Open PR: compare the branches by name.
		// Closed without merging: the head branch is usually deleted and the base
		// branch moves on, so pin both sides to the commits the PR was at when it
		// closed. GitHub keeps the head commit reachable via refs/pull/<n>/head,
		// which Sourcegraph mirrors.
		const [base, head] =
			pullRequest.state === "closed"
				? [pullRequest.base.sha, pullRequest.head.sha]
				: [pullRequest.base.ref, pullRequest.head.ref]
		url = `${instance}/r/${repoLink}/-/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?mode=Tour`
	}

	const { data: comments } = await github.rest.issues.listComments({
		owner,
		repo,
		issue_number: pullRequest.number,
	})

	const markedComments = comments.filter(
		(c) => c.body?.includes(diffTourCommentMarker) ?? false,
	)
	if (markedComments.length > 1) {
		console.log(
			"Found multiple comments with the Diff Tour marker. Updating only the first",
		)
	}

	const commentContent = `${diffTourCommentMarker}\n[Open the Diff Tour for this PR in Sourcegraph](${url})`
	const first = markedComments[0]
	if (first !== undefined) {
		await github.rest.issues.updateComment({
			owner,
			repo,
			comment_id: first.id,
			body: commentContent,
		})
	} else {
		await github.rest.issues.createComment({
			owner,
			repo,
			issue_number: pullRequest.number,
			body: commentContent,
		})
	}
}

module.exports = generateTourLink
