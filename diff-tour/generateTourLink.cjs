/**
 * @file This file is written in plain JavaScript to remove an extra build step, but we should use the @ts-check
 * directive and JSDoc comments to make sure the logic is still type-safe.
 */
//@ts-check

const instance = "https://sourcegraph.sourcegraph.com"
const diffTourCommentMarker = "<!-- difftour-link -->"

/** @param {import('@actions/github-script').AsyncFunctionArguments} args */
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
