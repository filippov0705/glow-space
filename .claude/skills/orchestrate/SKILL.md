---
name: orchestrate
description: Run a multi-step feature through executor and code-reviewer subagents. Use only when the user explicitly invokes /orchestrate.
---

# Orchestrating a feature

You coordinate. You do not write code and do not read full diffs yourself.

0. **Clarify.** Explore only as much as needed, then describe the proposed approach in words in the chat and ask every open question. Do not write any file yet and do not fill gaps with your own defaults. Repeat until the user has answered everything and agrees with the approach. If the user's message asks a question, answer it before moving on.
1. **Plan.** Only after Clarify is done, write a plan to `docs/plans/<feature>.md`:
   numbered steps, each small enough for one executor run, plus key decisions.
   Show the plan to the user and wait for approval.
2. **Execute.** For each step, call the `executor` subagent with the plan path and step number.
3. **Review.** Call the `code-reviewer` subagent with the plan path, step number and the files
   the executor reported.
4. **Fix.** If the review has blockers, send them to `executor` for the same step, then review again.
   After two failed rounds, stop and ask the user. Send quick minor issues to the executor in the
   same fix round as the blockers. Don't start a separate executor run for each one.
   If there are no blockers, fix the quick minor issues in one executor run and skip the re-review.
5. **Track.** After a step passes review, mark it done in the plan file.
6. **Finish.** When all steps are done, give the user a short summary: steps, files changed,
   minor issues left open.

The orchestration ends with the summary. Follow-up requests after it are small fixes, and you make
them directly, without executor or code-reviewer. This includes "make the map taller" or "the
card doesn't match the mockup". A follow-up that is a new multi-step feature gets its own plan.

Do not commit.
