# Repository overview

This repository contains the Angular frontend. Application code is under `src/app`, static assets are under `public`, and build/runtime configuration is defined by `angular.json`, TypeScript configs, Docker, and Nginx files.

The application uses Angular standalone architecture, lazy routes, functional guards and interceptors, RxJS services, Angular Material, and ngx-translate.

# Angular architecture

- Keep the application standalone; do not introduce `NgModule` structure without an explicit requirement.
- Preserve strict TypeScript, strict dependency injection, and strict template checking.
- Prefer existing Angular patterns and APIs already used by the repository.
- Keep API DTOs separate from local UI and player state unless they intentionally share the same contract.
- Use the configured aliases `@features`, `@common`, and `@environments`.

# Folder and feature organization

- Put feature-specific code in `src/app/features/<feature>`.
- Put code in `src/app/common` only when it is genuinely reused across features or is application-wide infrastructure.
- Keep feature components, models, services, guards, and translations near their feature.
- Do not move code into `common` merely to shorten imports.
- Preserve the existing route-based feature boundaries.

# Components and services

- Components should primarily manage view state, presentation, and user interaction.
- Keep HTTP calls, SignalR coordination, persistence, and reusable business workflows in services.
- Do not create additional instances of root services through component or route `providers` unless isolation is intentional and documented.
- Keep templates declarative and move complex transformations into typed component logic, services, or pipes.
- Preserve standalone component imports and use the existing shared components before adding duplicates.

# RxJS and state management

- Follow the existing Observable, Subject, and `BehaviorSubject` service patterns.
- Expose observable state without exposing writable subjects unnecessarily.
- Use `map` for value transformation; do not use `tap` to transform emitted values.
- Account for subscription cleanup and component lifecycle. Prefer template `async`, Angular lifecycle helpers, or a clear teardown strategy.
- Avoid nested subscriptions when composition with RxJS operators is practical.
- Keep side effects explicit and prevent state-update cycles.
- Define initial nullable state carefully and guard consumers before dereferencing it.

# HTTP and SignalR integration

- Keep HTTP requests in injectable services rather than components.
- Build URLs from `environment.apiUrl` and the existing API route constants.
- Preserve the configured credential, authentication, XSRF, and loader interceptor order unless the task requires a deliberate change.
- Register SignalR handlers before the connection is actively used.
- On reconnect, restore required device, player, and queue registration.
- Keep persistent device ID independent from transient SignalR connection ID.
- Do not assume reconnect preserves server-side Redis or group state.

# Player synchronization rules

- Only the active device may control real audio playback.
- Separate local browser audio events from remote synchronization events.
- Volume, position, track, play/pause, and active-device updates must not create feedback loops.
- Make remote state application idempotent where possible.
- Test player changes with multiple tabs and multiple devices, including reconnect and active-device handoff.
- Avoid treating a missing current track as a valid populated player state.
- Account for Safari behavior and unavailable or partially implemented browser media APIs.

# Routing, guards and interceptors

- Keep page-level routes lazy with the existing `loadComponent` approach.
- Place feature authorization and state checks in guards rather than page components.
- Keep guards and interceptors focused on one responsibility.
- Preserve wildcard and redirect behavior when adding routes.
- Do not bypass authentication, authorization, credential, or XSRF behavior without an explicit requirement.

# Styling and UI conventions

- Use SCSS and the shared styles under `src/app/common/styles` when the style is genuinely reusable.
- Follow the configured Prettier style: 100-column width and single quotes.
- Reuse Angular Material and existing common components before creating parallel UI primitives.
- Keep component-specific styling beside its component.
- Preserve responsive behavior and keyboard-accessible interaction.
- When changing media URLs or proxy behavior, verify both Angular development-server expectations and Docker/Nginx routing.

# Verification commands

Run when dependencies are not installed or `package-lock.json` changed:

```bash
npm ci
npm run build
npm test -- --watch=false
docker compose config --quiet
```

The only repository-defined npm scripts are:

```bash
npm start
npm run build
npm run watch
npm test
```

There are no repository-defined lint or formatting scripts. Do not report `npm run lint` or a formatting command as available.

# Git and change discipline

- Inspect `git status --short` before editing.
- Preserve unrelated staged, unstaged, and untracked work.
- Do not revert, overwrite, or broadly reformat unrelated files.
- Keep changes scoped to the requested frontend task.
- Do not edit backend files from this repository task.
- Do not create commits, push branches, or open pull requests unless explicitly requested.
- Do not apply automated fixes unless explicitly requested.

# Code review priorities

Review changes in this order:

1. Authentication, authorization, credential, and XSRF regressions.
2. Player feedback loops, wrong active-device behavior, and reconnect failures.
3. Subscription leaks, null-state errors, and duplicate root-service instances.
4. HTTP or SignalR logic placed in components.
5. Broken route guards, lazy loading, API URLs, or Nginx proxy behavior.
6. Violations of strict typing, feature boundaries, or shared-code placement.
7. Missing tests for changed interaction and multi-tab/device behavior.
