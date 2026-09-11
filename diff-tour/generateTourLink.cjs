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
 * @property {boolean} merged
 * @property {string} merge_commit_sha
 * @property {{ref: string}} base
 * @property {{ref: string}} head
 */

/**
 * @typedef {object} Context
 * @property {{pull_request?: PullRequest}} payload
 * @property {{owner: string, repo: string}} repo
 */

/**
 * @typedef {object} Comment
 * @property {number} id
 * @property {string | null | undefined} body
 */

/**
 * @typedef {object} Github
 * @property {object} rest
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
const diffTourCommentMarker = "<!-- difftour-link -->"

/** @param {GenerateTourLinkArgs} args */
async function generateTourLink({ github, context }) {
	const pullRequest = context.payload.pull_request
	if (pullRequest === undefined) {
		return
	}

	/** @type {string} */
	let url
	const { repo, owner } = context.repo
	const repoLink = `${owner}/${repo}`
	if (pullRequest.merged) {
		const commit = encodeURIComponent(pullRequest.merge_commit_sha)
		url = `${instance}/r/${repoLink}/-/commit/${commit}?mode=Tour`
	} else {
		const base = encodeURIComponent(pullRequest.base.ref)
		const head = encodeURIComponent(pullRequest.head.ref)
		url = `${instance}/r/${repoLink}/-/compare/${base}...${head}?mode=Tour`
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
