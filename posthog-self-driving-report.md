# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this web learning platform. Session Replay and Error Tracking were already enabled, Support was enabled, and native health, error, and support signal sources were activated.

The scout coordinator will pick up the fresh configurations within about 30 minutes. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/604653/inbox) as sufficient activity and corroboration accumulate.

## AI data processing

Approved by the organization-level setup gate.

## GitHub

GitHub was already connected through the PostHog GitHub App before this setup. GitHub Issues was not selected as an additional Self-driving responder.

## Products enabled

| Product | Result | Client check / note |
|---|---|---|
| Session Replay | Already enabled | Web recordings are present. The `posthog.init` configuration does not disable session recording. |
| Error Tracking | Already enabled | The web client has `capture_exceptions: true`; no conflicting override was found. No active error issues were observed in the initial probe. |
| Support (Conversations) | Enabled | Connect an inbound email, inbox, or Slack channel in PostHog before support tickets can arrive. |

## Signal sources

| Signal source | Action | Reason / reference |
|---|---|---|
| `health_checks` / `health_issue` | Enabled | Setup-health findings should always reach the inbox. Source config: `01a090eb-1378-7c52-a503-3e36c68783f6`. |
| `error_tracking` / `issue_created` | Enabled | New error issues are routed to the inbox. Source config: `01a090eb-0f2a-7a3d-8348-d4433e2e07ec`. |
| `error_tracking` / `issue_reopened` | Enabled | Reopened error regressions are routed to the inbox. Source config: `01a090eb-0d0b-793f-925a-c40ec9d7dc80`. |
| `error_tracking` / `issue_spiking` | Enabled | Spiking error issues are routed to the inbox. Source config: `01a090eb-0d47-7dd6-87bb-81e3dfd26e45`. |
| `conversations` / `ticket` | Enabled | The responder is armed; it remains idle until an inbound Support channel is connected. Source config: `01a090eb-0f09-7be1-b4bf-c15f29c62cfd`. |
| `signals_scout` / `cross_source_issue` | Skipped — on by default | No opt-out row existed, so scout findings already reach the inbox. |
| `session_replay` / `session_analysis_cluster` | Skipped — retired route | Replay coverage is provided by the Replay Vision scanners below. |
| `replay_vision` | Skipped — scanner-owned route | Each scanner’s `emits_signals: true` setting is its own responder configuration. |

## Connected tools

No external issue-tracker, error-tracker, support-desk, security, review, or search-analytics responder was selected in this setup.

| Tool offered | Result |
|---|---|
| GitHub Issues | Not used as a responder; the GitHub App itself was already connected. |
| Linear | Not used. |
| Jira | Not used. |
| Sentry | Not used. |
| Zendesk | Not used. |

## Scout troop

Seven scouts are active, below the ten-scout quality ceiling. They run daily by default and emit findings to the Self-driving inbox.

| Active scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces without a dedicated specialist. |
| `signals-scout-product-analytics` | Core product-flow conversion, retention, lifecycle, and path health. |
| `signals-scout-web-analytics` | Traffic, attribution, and landing-page health. |
| `signals-scout-web-vitals` | Page-level Core Web Vitals regressions. |
| `signals-scout-health-checks` | Actionable PostHog instrumentation and setup health issues. |
| `signals-scout-course-exploration-stalls` | Custom monitor for learners who explore courses but do not progress into lessons. |
| `signals-scout-lesson-navigation-health` | Custom monitor for destination-specific lesson-navigation failures. |

| Disabled scout | Reason |
|---|---|
| `signals-scout-ai-observability` | No active LLM telemetry was established by the project scan. |
| `signals-scout-anomaly-detection` | No established saved-insight watchlist was found; targeted specialists were preferred. |
| `signals-scout-apm` | No APM or distributed-tracing surface was established. |
| `signals-scout-conversations` | Support is routed through the native ticket responder. |
| `signals-scout-csp-violations` | No CSP reporting configuration was found. |
| `signals-scout-customer-analytics` | No account/group analytics surface was established. |
| `signals-scout-data-pipelines` | No CDP, batch-export, or Hog Flow surface was established. |
| `signals-scout-data-warehouse` | No relevant external warehouse source was selected. |
| `signals-scout-error-tracking` | Error tracking is covered by the native error responders. |
| `signals-scout-experiments` | No active experiment surface was established. |
| `signals-scout-feature-flags` | No active flag usage was established in this repository scan. |
| `signals-scout-inbox-validation` | No previously resolved Self-driving reports exist to re-measure yet. |
| `signals-scout-insight-alerts` | No existing alert surface was established. |
| `signals-scout-logs` | No logs telemetry surface was established. |
| `signals-scout-mcp-tool-calls` | MCP tool telemetry is not a primary product surface for this application. |
| `signals-scout-observability-gaps` | The health scout and custom monitors provide a focused initial coverage set. |
| `signals-scout-replay-vision` | No accumulated scanner observations exist yet; the new scanners provide direct coverage. |
| `signals-scout-revenue-analytics` | No payments or revenue data surface was found. |
| `signals-scout-session-replay` | Replay is covered by the Replay Vision scanners below. |
| `signals-scout-skills-store` | Skills-store hygiene is not a primary application surface. |
| `signals-scout-surveys` | No surveys exist. |
| `signals-scout-tasks` | PostHog Tasks is not a primary application surface. |

### Run budget

- **Maximum runs per day:** 100
- **Runs used today:** 0
- **Runs remaining today:** 100
- **Announcement:** Scouts are in early access. Each project gets up to 100 scout runs a day. Contact `team-self-driving@posthog.com` if more are needed.

## Custom scouts

| Custom scout | Design rationale |
|---|---|
| `signals-scout-course-exploration-stalls` | Watches the course-outline-to-lesson-selection and learning-start progression implemented by `CourseContent` and `CourseProgressBar`. Its discriminator is a sustained progression-rate drop while overall course activity holds, which prevents ordinary traffic changes from becoming reports. The standard product-analytics scout covers saved flows; this scout owns the application-specific learning journey. |
| `signals-scout-lesson-navigation-health` | Watches lesson selections from `CourseContent` for route-specific loss of follow-on destination activity. Its discriminator is a sustained, destination-specific unmatched rate compared with the route’s baseline and other lesson destinations. It covers silent navigation breakage that may not generate an exception. |

Considered but not added: search quality and video-progress monitoring. They are described in the project plan but no corresponding runtime event contract was found in the scanned implementation, so they are not ready for a reliable monitor.

If either custom scout becomes noisy, set `emit: false` on its configuration in PostHog to keep it running in dry-run mode without sending findings to the inbox.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes qualifying observations to the inbox. These are the only components in this setup that spend Replay Vision quota. Findings arrive at half weight and require independent corroboration before promotion into a report.

| Brief | Result | Scope | Sampling | Estimated monthly usage |
|---|---|---|---:|---:|
| Breakage monitor — **Course and lesson breakage** | Created | Recordings whose current URL includes `/courses/`, covering course detail pages immediately preceding lesson navigation. It watches visible catalog/content loading failures, non-expanding outlines, ineffective lesson links, and failed learning actions. | 50% | 0 observations / 0 credits |
| Frustration monitor — **Learning flow frustration** | Created | Recordings containing `$rageclick` only; no URL filter was added, keeping it distinct from the breakage monitor. It watches visible repeated attempts, outline-control retries, ineffective lesson or learning actions, and search frustration. | 100% | 0 observations / 0 credits |

Replay Vision quota was verified before creation: 2,500 credits remain in the current period, none used, and the organization is not exhausted. The estimate found no eligible recordings in its one-day sizing window, so both scanners are armed and will begin observing as recordings match their scopes.

## Repository files

| File | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this setup record. |

No application source files were changed. The existing browser `posthog.init` was verified to preserve Session Replay and exception capture.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog to begin producing support-ticket findings.
- [ ] Let the application receive production learner activity so the custom scouts can establish their baselines and the Replay Vision scanners can begin observing matching recordings.
- [ ] The project profile endpoint was not yet materialized, and the connected API token could not read the event-schema endpoint. The configured scouts will validate their event contracts when they run; re-authenticate with property-definition read access if you need interactive schema inspection sooner.

## What happens next

The scout coordinator should pick up the fresh configurations within about 30 minutes. Scouts draw from the verified 100-runs-per-day early-access budget; their findings cluster into reports in the Self-driving inbox, where immediately actionable reports can begin coding tasks.
