---
name: react-ts-feature-pattern
description: Create or refactor TypeScript React feature components with a presentational-first module pattern, dedicated component types modules, typed hook contracts, safe deduplication, Sonar-like review, and optional strict testing or test audits. Use for TypeScript component or recursive folder refactors, index.tsx and component-hook conventions, type-safety cleanup, functional test-gap audits, or standard/strict/test-audit modes. Do not use for JavaScript or JSX components.
---

# React TS Feature Pattern

## Overview

Apply a strict, repeatable TypeScript structure for React components so UI stays presentational, contracts stay type-safe, and logic is encapsulated in hooks/helpers.
Use this workflow for both new components and refactors.
This skill supports two scopes:
- single-component scope
- folder scope (apply the same rules recursively to a target folder)

## Operating Modes

Resolve the mode from the user's request. If no mode is stated, use `standard`.

- `standard` (default): apply the component pattern and Sonar-like review without inspecting, running, creating, modifying, or auditing unit tests.
- `strict`: apply the component pattern with test-driven development (ADR-0021): for every new or changed behavior, write the test first, watch it fail for the expected reason, then implement (see Red-Green-Refactor). Leave every new or materially refactored component functionally covered. Do not use percentage thresholds; cover its observable behaviors and ownership boundary.
- `test-audit`: inspect components and tests without editing source or test files. Return a functional behavior inventory, existing coverage, gaps, and recommended test cases.

Accept natural-language equivalents such as `modo estricto`, `auditoria de pruebas`, `solo auditar tests`, or `standard mode`. An explicit user instruction always overrides the default.

### Project overrides

This repository's `AGENTS.md` takes precedence over the default above: use `strict` when creating a component or changing its observable behavior, and use `standard` only for structural refactors with no observable impact or when the user asks for it. In `strict`, every new or changed component ships with its mirrored test under `tests/` and the accessibility assertion described in Test Assurance. If this skill and an approved project document disagree, stop and ask for a decision. ADR-0021 (test-driven development) is binding: if this skill contradicts it, ADR-0021 prevails. `standard` performs no test work inside this skill; the project gate `npm run check` still runs the whole suite regardless of mode.

Example invocations:

- `Use /react-ts-feature-pattern on ComponentName.` -> `standard`
- `Use /react-ts-feature-pattern in strict mode on this folder.`
- `Use /react-ts-feature-pattern in test-audit mode on this component; do not implement.`

## Module Contract

For each component `ComponentName`, use:

- `ComponentName/`
- `ComponentName/index.tsx` -> presentational rendering, prop wiring, `export const ComponentName = ...`, and type imports from `types.ts`
- `ComponentName/types.ts` -> `ComponentNameProps` when the component receives props and every other type owned by the component module
- `ComponentName/useComponentName.ts|tsx` -> typed state, effects, handlers, and orchestration (use `.tsx` whenever the hook returns JSX nodes; use `.ts` otherwise)
- `ComponentName/styles.module.scss` -> local styles (only when needed). ADR-0003 and the README define SCSS modules; use a plain `styles.scss` only when the project approves a non-modular strategy
- `ComponentName/constants.ts` -> reusable constants for the module (only when needed)
- `ComponentName/utils.ts` -> pure helpers/mappers/formatters for the module (only when needed)

Keep every component-owned type in `ComponentName/types.ts`, including props used only by `index.tsx` and contracts used by its hook, utilities, or constants. Omit `types.ts` only when the component module declares no types of its own. Do not move external domain or service contracts into a component merely to satisfy this structure.

## Single Component Per File (Strict)

- A source file can contain only one React component.
- `index.tsx` must export only `ComponentName` and must not declare extra local components.
- Prefer named exports in `index.tsx` (`export const ComponentName = ...`). Do not default-export the main component from `index.tsx`.
- If you need another visual piece, create it as its own component folder with the same pattern (`index.tsx`, optional `use<Component>.ts|tsx`, optional `styles.module.scss/constants.ts/utils.ts`).
- Hooks and utility files (`use*.ts|tsx`, `utils.ts`, `constants.ts`) must not declare React components (unless the hook intentionally returns JSX).

## Hook Extraction Gate

Extract logic only when it reduces cognitive load. Do not create a local `use<Component>` hook just to satisfy the folder shape.

Before creating or keeping a local hook, verify that at least one real responsibility belongs there:

- state, effects, async flows, subscriptions, timers, or cleanup
- handlers with behavior beyond directly forwarding a callback
- non-trivial derived data, validation, permissions, or data adaptation
- orchestration across multiple hooks, services, stores, or child components
- repeated local decisions whose names make the render easier to scan

Keep render-local wiring inline when it is clearer at the JSX call site:

- simple `className` composition such as `` `base ${className}`.trim() ``
- static child props such as icon, color, size, variant, or placement
- direct callback forwarding such as `onClick={onClose}`
- one-line values whose meaning is immediately visible in JSX
- prop bags such as `buttonIconProps`, `rootProps`, or `modalProps` that only hide static JSX wiring

Avoid hooks that mainly return grouped props for one child component. Prefer explicit JSX when the child component's contract is important for readability.

## Constant Placement Gate

Before finishing any touched TypeScript or TSX scope, inspect its module-level `const` declarations and classify them by responsibility rather than by syntax.

- Put reusable or meaningful static module configuration in the closest owning `constants.ts`: limits, defaults, lookup tables, option arrays, regular expressions, formatter instances, stable configuration values, and other immutable data initialized once for the module.
- When an obvious static literal has a single use and does not clarify a meaningful contract or configuration decision, keep the literal inline instead of creating a named module-level constant.
- Do not leave a named static configuration constant in `index.tsx`, `use*.ts|tsx`, `utils.ts`, API endpoint modules, or handlers merely because it currently has one consumer. Either inline it or place it in the owning `constants.ts`.
- Keep functions, components (including lazy component references), hooks, factories, stores, API/service instances, mutable caches or registries, and DOM/request/URL-derived or per-call values with their actual implementation owner. They are not configuration constants merely because JavaScript declares them with `const`.
- Treat an existing semantically dedicated file such as `config/*.ts`, `resources.ts`, a fixture module, or an intentional registry entrypoint as a valid owner. Do not rename or split it solely to produce a file named `constants.ts`.
- Keep `constants.ts` free of JSX, hooks, component declarations, executable helpers, side effects, service construction, and mutable runtime state. Store component references rather than rendered JSX nodes when a static lookup needs UI component values.
- Preserve independent test expectations as literals when sharing the production constant would make the test unable to detect contract drift.

## Safe Deduplication Gate

Before finishing a creation or refactor, inspect the touched component module and its closest siblings or consumers for repeated logic, configuration, type contracts, or adapters.

- Consolidate only semantically equivalent duplication: the repeated code must have the same responsibility, contract, and reason to change.
- Extract to the lowest common owner that matches actual usage: `utils.ts` for pure logic, `constants.ts` for shared configuration or literals, `types.ts` for component-owned type contracts, or a domain-specific module at the closest shared boundary.
- Preserve public contracts, evaluation order, error shapes, asynchronous behavior, rendering, and other observable results.
- Do not abstract coincidental similarity, widen types for reuse, create broad shared utilities, or add a new layer without a concrete shared responsibility.
- In `strict`, add or adjust focused tests when existing tests do not safely characterize the behavior being consolidated.
- If safe extraction exceeds the authorized scope or its behavior cannot be verified, keep the implementation stable and report the pending duplication instead of forcing the refactor.

## Placement

Place every new component with its closest owner (ADR-0008) and keep `app -> pages -> features -> entities -> shared` as the only dependency direction:

- page-private component: `src/pages/<Page>/components/<Component>/`
- feature-private component: `src/features/<capability>/components/<Component>/`
- entity-private component: `src/entities/<entity>/components/<Component>/`
- component shared by several owners with a shared contract: `src/shared/ui/<Component>/`
- global composition (routes, providers, layout): `src/app/<Component>/`

Never create the global technical folders `src/components/`, `src/hooks/`, `src/services/` or `src/slices/`: `npm run architecture:check` rejects them (PLAT-017). Promote a component only to the smallest common owner and only when its consumers share contract and reason to change. Mirror the path under `tests/`, for example `tests/pages/<Page>/components/<Component>/index.test.tsx`.

## Creation Workflow

In `strict`, the order below is not the order of work: follow Red-Green-Refactor. Create the folder and the `types.ts` contract (steps 1 and 5) first, write and fail the test, then implement steps 2-4 and 6-9 as Green, and apply steps 11-12 as Refactor with the tests passing. `standard` follows the numbered order.

1. Create the component folder using the feature naming convention already used in the target area.
2. Create `index.tsx` with only rendering responsibilities:
   - receive props
   - export the component with `export const ComponentName = ...`
   - compose UI components
   - bind callbacks from props or hook
   - do not declare secondary components in the same file
   - no data-fetching/business rules inside JSX file
   - import `ComponentNameProps` from `types.ts` when the component has props and type the destructured parameter directly
   - prefer a type alias for props unless the repository consistently uses interfaces
   - export the props type from `types.ts`; do not declare component-owned types in `index.tsx`
   - do not use `React.FC` unless the repository explicitly standardizes on it
   - if defaults are needed, set them in typed function parameters/destructuring (for example `({ items = [] }: ComponentNameProps)`)
   - infer the exact props contract from current usage, defaults, and call sites; do not widen it for convenience
3. Create `use<Component>.ts|tsx` whenever `index.tsx` would otherwise contain state, effects, handlers with behavior, async flows, data orchestration, non-trivial derived values, adaptation, or other component logic not already encapsulated by an existing custom hook (prefer `.ts`; use `.tsx` whenever the hook contains or returns JSX):
   - state management
   - non-trivial derived values
   - effects and async flows
   - interaction handlers with behavior beyond direct callback forwarding
   - when the local hook exists and translations are also needed, let it own `useTranslation` and expose `t`
4. Skip `use<Component>` when the component is purely visual, when render-local wiring is clearer inline, or when its only logic is invoking an existing custom hook and rendering the ready-to-use values it returns. Do not wrap one custom hook in another merely to rename or re-export its result. `useTranslation` is one example of this general rule. Prefer an implicit return when no hook is needed.
5. Create `types.ts` whenever the component owns props or any other type, even when a type has a single consumer inside the module. Keep external domain contracts with their existing owner.
6. Apply the Constant Placement Gate: create `constants.ts` for reusable or meaningful static module configuration, including a meaningful contract value with one current runtime consumer.
7. Keep obvious single-use literals and one-off labels inline near their only usage; do not create a named module-level midpoint.
8. Create `utils.ts` only for pure helpers used by hook/component.
9. Create `styles.module.scss` only for component-specific styling.
10. In `strict`, the tests already exist from the Red phase; run the whole suite here. Perform no unit-test work in `standard`.
11. Apply the Safe Deduplication Gate.
12. Finish with the Sonar-like quality review pass before validation.

## Refactor Workflow

In `strict`, a structural-only refactor keeps the existing tests green and needs no new test. When the refactor changes behavior, write the test first and verify Red (see Red-Green-Refactor). When a materially refactored unit has no tests, write characterization tests first and label them as such (they pass immediately, so they are not Red).

1. Inspect current component and identify logic in `index.tsx`.
2. If `index.tsx` includes additional inline components, extract each one into its own component folder.
3. Extract state, effects, handlers with behavior, async flows, non-trivial derived values, adaptation, and orchestration concerns into `use<Component>.ts|tsx` when the hook makes the component easier to understand. Keep simple JSX wiring inline. A standalone call to an existing custom hook is the exception when its returned values are already ready for rendering. When other component logic exists, create the local hook and let it compose the existing hook as needed.
4. Move pure helper functions into `utils.ts`.
5. Apply the Constant Placement Gate to every module-level declaration in the touched scope. Move reusable or meaningful static configuration into the closest `constants.ts`, inline obvious one-off literals, and retain runtime values with their implementation owner.
6. Move every component-owned type, including a single-use props contract, to the module's `types.ts`.
7. Keep `index.tsx` focused on layout/rendering.
8. Add or update the TypeScript props contract in `types.ts` when props exist, import it into `index.tsx`, and preserve optionality, unions, callback signatures, and nullability.
9. In `strict`, apply Red-Green-Refactor for changed behavior and keep existing tests green; perform no unit-test work in `standard`.
10. Apply the Safe Deduplication Gate.
11. Run the Sonar-like quality review pass on every touched file.
12. Preserve external behavior and props contract unless user requests API changes.

## Folder Refactor Mode

Use this mode when the user asks to apply the pattern to a whole folder.

1. Recursively inventory components and nested component folders before editing. Inventory matching tests only in `strict` or `test-audit`.
2. Discover candidate files in the target folder:
   - all `index.tsx` files
   - files containing inline React components mixed with view logic
3. Classify each candidate by test impact:
   - structural-only
   - logic moved
   - behavior changed
   - new component
4. Refactor each component module to this pattern:
   - `index.tsx` (presentational only)
   - `types.ts` (required when the component owns any types)
   - `use<Component>.ts|tsx` (logic)
   - optional `styles.module.scss/constants.ts/utils.ts`
5. Enforce one component per file in every touched module.
6. Keep each component's public API stable unless the user asks for API changes.
7. Refactor in small safe batches if the folder is large.
8. In `strict` mode, present the recursive inventory and batch plan before editing when the scope is large.
9. In `strict`, apply Red-Green-Refactor per migrated module for new or changed behavior; perform no unit-test work in `standard`.
10. Apply the Safe Deduplication Gate per migrated batch.
11. Run the Sonar-like quality review pass per migrated module.
12. Finish with lint/build validation. Run tests only in `strict`; report audit findings only in `test-audit`.

### Folder Mode Output Contract

- Do not stop after one component if the request target is a folder.
- Provide a short summary listing:
  - modules migrated
  - modules skipped and why
  - pending modules (if any)
  - in `strict`: tests created, updated, or executed, and the failure observed in Red per behavior (or the declared exception)
  - in `test-audit`: functional gaps and recommended tests

## Red-Green-Refactor (`strict` only)

Defined by ADR-0021. It governs the component, its local hook and its utilities, and any standalone hook or pure logic this skill is applied to. Code outside this skill's scope (`model/`, `api/`, tools) follows the same cycle through `AGENTS.md`. Never apply this section in `standard`.

For each behavior in the Functional Inventory, one at a time:

1. **Contract.** Create the folder and `types.ts`, plus a minimal stub (a component that renders nothing, a hook that returns its typed contract with no logic) only so the test can import the unit.
2. **Red.** Write one test for one behavior through the public contract (rendered output, user interaction, state, i18n text). Include `expectNoAccessibilityViolations` in the first test of any UI and in each relevant state. Run the test file and confirm it fails because the behavior is missing.
3. **Green.** Write the minimum implementation that passes, then run the test file and the whole suite. Add no behavior that no test requires.
4. **Refactor.** With every test passing, apply the Hook Extraction Gate (extract the hook only now; the component tests keep guarding the contract), the Constant Placement Gate, the Safe Deduplication Gate and the Sonar-like pass. Add no behavior.
5. Repeat for the next behavior.

A valid Red fails with an assertion about the missing behavior. These are not valid Red: an import or type error, a wrong selector, a configuration error, or a test that passes immediately (it covers existing behavior, so fix the test). Fixing a defect starts with a test that reproduces it.

Report, per behavior or criterion, the test and the failure reason observed. Never claim a Red that was not actually run. Declare exceptions to TDD explicitly (declarative configuration without logic, SCSS, assets, generated code, throwaway prototypes). TDD covers observable behavior, not visual presentation; do not test static style declarations. No tool verifies the test-first order, so this report is the only evidence.

## Test Assurance (`strict` and `test-audit` only)

Treat tests as behavior contracts, not as a coverage-percentage exercise.
Never apply this section in `standard`.

### Test Discovery

1. Run test discovery only in `strict` or `test-audit`.
2. Read the repository's local instructions and test conventions first.
3. Locate tests that mirror or exercise the target component, hook, and helpers.
4. Detect the existing runner, rendering library, mocking style, and file placement.
5. Do not install or replace test tooling unless the user explicitly requests it.
6. If the project has no test infrastructure, report the limitation and do not invent one silently.
7. Preserve the repository's TypeScript test configuration and do not introduce a second transpilation path.
8. Name test files after the exact source file they cover by inserting `.test` before the extension:
   - `src/path/Component/index.tsx` -> `tests/path/Component/index.test.tsx`
   - `src/path/Component/useComponent.ts` -> `tests/path/Component/useComponent.test.ts`
   - `src/path/Component/utils.ts` -> `tests/path/Component/utils.test.ts`
9. For component folders that expose `index.tsx`, do not name the presentational test after the component folder (for example, avoid `Component.test.tsx`); use `index.test.tsx`.

### Test and MSW Placement

- Keep unit and component test files under the root `tests/` tree, mirroring their `src/` ownership path.
- When a repository uses Mock Service Worker, keep its shared TypeScript infrastructure in a root `mocks/` folder alongside `src/` and `tests/`:
  - `mocks/browser.ts` for browser setup
  - `mocks/server.ts` for the test server setup
  - `mocks/handlers/` for handlers grouped by API or functional domain
  - `mocks/fixtures/` for reusable simulated responses and data
- Do not place shared MSW handlers, fixtures, or setup inside `src/` or `tests/`. Tests may import the server, handlers, and fixtures they need from `mocks/`.
- Keep test-local spies, stubs, and one-off values with the owning test when they are not shared MSW infrastructure.
- Components and component hooks must not import MSW or branch on whether data comes from MSW or a real API.
- Base handlers on approved API contracts and specification scenarios. Do not invent response fields, fallback schemas, or undocumented endpoints to make a test pass.
- In `strict`, add or change shared MSW assets only when the covered behavior needs network-level simulation and the repository already has approved MSW infrastructure. Do not install, initialize, or reconfigure MSW without explicit authorization.
- In `standard`, perform no test or MSW test-infrastructure work. In `test-audit`, report placement or contract gaps without editing them.
- The generated MSW worker script lives only in the directory configured in `msw.workerDirectory` of `package.json` (`mocks/public/` in this repository): it is generated by MSW solely for browser delivery and must not contain project handlers or mock logic.

### Functional Inventory

Inventory only observable responsibilities that belong to the unit:

- primary rendering and meaningful conditional branches
- user interactions and callback contracts
- loading, empty, disabled, success, and error states when applicable
- validation and permission behavior when applicable
- effects, timers, subscriptions, and cleanup when applicable
- pure transformations with meaningful branches
- accessibility: an `expectNoAccessibilityViolations` assertion (`tests/setup/axe.ts`, axe-core, WCAG 2.1 A and AA without colour contrast) for each page or component with UI, in its relevant states; it does not replace manual review of contrast, keyboard, focus or screen reader

Do not test framework internals, implementation details, static styling declarations, or child behavior already owned by the child component.

### Strict Impact Policy

- `standard`: do not inspect, execute, create, update, or report on unit tests, regardless of impact classification.
- Structural-only change in `strict`: run relevant existing tests without backfilling historical gaps unless the refactor is material.
- Logic moved without behavior change: verify the public contract and update tests only when the move invalidates their ownership or setup.
- Behavior changed in `strict`: write or update the tests for the complete changed behavior first and verify Red, then implement.
- New component in `strict`: cover its functional inventory test-first.
- Material refactor in `strict`: close functional gaps for that component even when some gaps pre-date the current change.
- Mechanically touched file in `strict`: do not treat formatting, import updates, or path moves alone as a material refactor.
- When the Hook Extraction Gate keeps a component visual, cover the component contract directly. Do not create a local hook, hook test, or helper file just to create a separate unit-test target.

### Ownership Boundaries

- Parent component tests cover composition, prop wiring, and parent-owned decisions.
- Child component tests cover child interactions and rendering branches.
- Hook tests cover orchestration, state, effects, async flows, and cleanup.
- Utility tests cover non-trivial pure behavior.
- Avoid repeating a child's full behavior in every parent test.

### Test-Audit Output

In `test-audit`, do not edit code. Report each relevant unit with:

- observable functionality
- existing test evidence
- uncovered behavior
- recommended test cases
- risk or priority

Test-first order cannot be verified after the fact; report only whether tests exist and note that Red evidence is not auditable. Use coverage tooling only as supporting evidence when it already exists. Never use a percentage as the sole definition of functional completeness.

## Sonar-Like Quality Review Pass

Use this pass after creating or refactoring a component. Treat actual Sonar/SonarLint findings provided by the user as authoritative; otherwise apply this checklist as a conservative approximation of common Sonar code-quality rules.
Read `references/sonar-local-rules.md` only when the user provides Sonar or SonarLint findings; it is the project-specific SonarQube for IDE standalone-mode rule overlay. Precedence is: explicit user findings, then `references/sonar-local-rules.md` when it was read, then this generic checklist. Without findings, apply only the generic checklist below.

1. Simplify control flow:
   - reduce nested `if`/`else`, loops, and switch branches when extraction or early named decisions improve readability
   - replace small or single-purpose `switch` statements with `if` statements when Sonar flags readability and the resulting code is simpler; keep `switch` when it clearly models an exhaustive domain decision or improves scanning
   - avoid nested ternaries; replace with named variables, helper functions, or small render branches
   - prefer positive conditions, but keep guard clauses when they make loading/error paths clearer
   - avoid duplicated boolean expressions and repeated condition fragments
2. Keep functions focused:
   - split long handlers, mappers, validators, and effects into named helpers when each extracted function has a clear responsibility
   - reduce function nesting when Sonar flags deeply nested callbacks; extract named helpers, flatten early decisions, or move pure data shaping outside effects/render callbacks without changing execution order
   - keep `useEffect` bodies small; move setup/cleanup helpers out when the effect mixes unrelated concerns
   - avoid passing large anonymous functions directly inside JSX
3. Remove duplication:
   - reuse local helpers/options only when the duplicated logic is genuinely the same contract
   - keep shared helpers at the lowest folder that matches actual usage
   - do not create broad shared utilities only to satisfy a smell
4. Tighten React and props contracts:
   - remove unused props, imports, state, refs, and variables
   - do not use array indexes as React keys when the list can reorder, add, remove, or filter; prefer stable values from the existing data contract such as `id`, `key`, `value`, `alias`, or a stable composite key
   - if no stable key exists, create one during data shaping in the hook/helper from existing stable fields; do not invent random keys during render or add new data-contract fields only to silence a warning
   - avoid `any`; use exact domain types or `unknown` plus narrowing when the input is genuinely unknown
   - model optional, nullable, and discriminated states explicitly; do not hide contract uncertainty with assertions
   - avoid declaring components, hooks, or reusable type fragments inside render bodies
   - preserve generics and callback parameter/return types across refactors; do not erase them to make code compile
5. Clean reliability smells:
   - remove dead branches, stale comments, debug logs, and commented-out code
   - avoid magic repeated strings/numbers when a named local constant clarifies domain meaning
   - use `String.raw` template literals for string patterns with escaped backslashes when Sonar flags them, especially `RegExp` patterns; preserve the exact regex meaning and only escape dynamic input when the existing behavior treats it as literal text
   - avoid mutating props, Redux state, function parameters, or imported constants
   - avoid async functions directly as `useEffect` callbacks; define and invoke an inner async function when needed
6. React accessibility and JSX validity:
   - prefer named native landmarks over explicit `role="region"`; use the most specific semantic element and preserve the accessible name, focusability, scrolling, handlers, refs, classes, and layout
   - remove `tabIndex` from passive wrappers; scrollability alone is not interactivity, and interactive focus must use a native control or a complete matching role and keyboard contract
   - when an existing non-interactive DOM element such as `div`, `span`, or raw `svg` has mouse, pointer, or keyboard handlers, preserve the rendered element and visual output by default; resolve accessibility warnings with semantic props (`role` when appropriate), keyboard activation, and focus handling when this matches the existing interaction
   - do not mechanically replace existing elements with native interactive elements such as `button` or `a` during refactors unless the user explicitly asks for semantic tag changes or local context proves the visual/DOM contract will remain stable
   - do not add `tabIndex` as a standalone warning silencer; only add it with the matching role and keyboard behavior required for the interaction
   - do not define React components inside another component body or inline component props; extract them to module scope or use a stable component reference and pass data as props
   - remove invalid or unknown JSX DOM props; move SCSS-like selectors such as `&:hover` out of inline `style` objects and into `styles.module.scss`
   - keep user text-spacing adjustments possible: avoid `!important` on `letter-spacing`, `word-spacing`, or `line-height` below WCAG thresholds; prefer removing `!important`, or use at least `0.12em`, `0.16em`, and `1.5` respectively when the override is genuinely required
7. Preserve intent over mechanical compliance:
   - preserving the rendered element, classes, layout, and visual output is part of the contract; do not change markup semantics, wrappers, styles, spacing, or component library controls just to quiet a warning
   - do not change external behavior, data contracts, navigation, or layout algorithms just to quiet a warning
   - when a warning cannot be fixed safely within scope, leave the code stable and report the pending warning

## Rules

- Prefer ASCII.
- Keep naming consistent: `use<ComponentName>` for the component's local hook.
- If a hook returns JSX, its filename must use the `.tsx` extension.
- Prefer named exports for component `index.tsx` files.
- Use `.tsx` only for files containing JSX; use `.ts` otherwise.
- Type component props explicitly in `ComponentName/types.ts` when props exist. Prefer `type ComponentNameProps = { ... }` unless repository conventions require an interface.
- Do not use `React.FC` unless the repository explicitly standardizes on it.
- Avoid `any`; prefer precise types or `unknown` with explicit narrowing.
- Do not add non-null assertions or type assertions merely to silence the compiler; prove the invariant or model it in the type contract.
- For purely visual components that only render props and derive no values, prefer implicit return in `index.tsx`; directly consuming an existing custom hook is also allowed when its output is ready to render.
- Do not create `use<Component>` when the component is fully visual or its only logic is invoking an existing custom hook and consuming its ready-to-use output.
- Create `use<Component>` for small component logic only when it has real behavior or orchestration, such as resolving a message from inputs, managing state/effects, or declaring a handler that does more than direct callback forwarding.
- Do not create `use<Component>` for simple render-local wiring: className concatenation, static child props, direct callback forwarding, or grouped prop bags that obscure a child component's visible contract.
- Calling an existing custom hook alone does not justify a wrapper hook. This includes, but is not limited to, `useTranslation`.
- Avoid creating files that are not needed by the module.
- Do not keep named static configuration in implementation files as a midpoint. Extract it to the closest `constants.ts` when it represents reusable or meaningful module configuration; inline it when it is single-use and obvious at the point of use. Component-owned type fragments still belong in `types.ts`.
- Do not misclassify functions, components, hooks, factories, service/store instances, mutable caches or registries, or runtime-derived values as constants solely because they use `const` syntax.
- Enforce one React component per file.
- Prefer positive conditions in `if` statements.
- Avoid leading-negation conditionals such as `if (!isReady)`.
- When needed, rewrite logic to positive checks (for example `if (isReady) { ... } else { ... }`) to reduce Sonar warnings like unexpected negation.
- Keep translation calls such as `t('loading')` in the presentational component. When `use<Component>` exists for other component logic, let it own `useTranslation` and expose `t`; do not return bags of pretranslated labels.
- Do not invent fallback field names, schema paths, or data contracts during refactors. Use the exact contract currently defined by the feature or ask before adding fallbacks.
- Apply the Safe Deduplication Gate before considering a creation or refactor complete.
- Keep comments concise and only where useful.
- Keep TypeScript props, hook inputs, hook outputs, utility signatures, and actual usage synchronized after every change.
- Do not declare an empty props type for components without props.
- Prefer defaults in typed function parameters/destructuring.
- Preserve readonly contracts when callers provide readonly data; do not add mutation solely to simplify typing.
- Resolve and state the active testing mode before substantial work.
- Keep test scope tied to behavioral impact, not merely to every file changed by a recursive refactor.
- In `standard`, never inspect, execute, create, modify, audit, or report on unit tests.
- In `strict`, close functional gaps only for new or materially refactored units.
- In `test-audit`, do not modify source or tests.

## Acceptance Checklist

- Folder exists with component name.
- `index.tsx` is presentational and thin.
- `index.tsx` directly contains no state, effects, data adaptation, orchestration, non-trivial derived values, or handlers with behavior. It may contain simple render-local wiring such as className composition, static child props, and direct callback forwarding when that is clearer inline.
- `index.tsx` exports the component as a named export, not a default export.
- If props exist, `types.ts` defines and exports an up-to-date `ComponentNameProps` contract; `index.tsx` imports and applies it directly to the component parameter.
- If props do not exist, neither `index.tsx` nor `types.ts` declares an empty props type.
- Props optionality, callback signatures, unions, readonly values, and nullability match real call sites.
- Conditionals avoid leading negation (`if (!condition)`) unless there is a clear guard-clause reason.
- Sonar-flagged small `switch` statements are simplified to `if` statements only when readability improves and behavior stays identical.
- No source file in the touched module contains more than one React component.
- Rendered lists use stable keys from the existing data contract; array indexes remain only when the list is static and cannot reorder, add, remove, or filter, and the exception is reported if Sonar still flags it.
- String patterns with escaped backslashes use `String.raw` when it preserves regex/string meaning.
- Deeply nested callbacks/functions flagged by Sonar are flattened or extracted when it can be done without changing execution order or data contracts.
- Existing non-interactive elements with mouse, pointer, or keyboard handlers keep their rendered tag unless a semantic tag change was explicitly requested or proven safe.
- Explicit `role="region"` uses a named native landmark when the current element represents a real section, navigation, complementary area, or main region; the replacement preserves accessible naming and behavior.
- Any remaining non-interactive element with interaction handlers has a justified semantic exception with matching `role`, focusability, and keyboard behavior.
- No element uses `tabIndex` as a standalone warning silencer; focusability matches the element role and interaction contract.
- Passive landmarks, layout wrappers, and scroll containers without keyboard behavior do not declare `tabIndex`; every retained occurrence has a native interaction or explicit programmatic-focus owner.
- No React component is declared inside another React component body or inline component prop.
- JSX elements do not include invalid DOM props or CSS selector syntax inside inline `style` objects.
- Text-spacing declarations do not combine sub-threshold `letter-spacing`, `word-spacing`, or `line-height` values with `!important`; user accessibility overrides remain possible.
- No touched file has obvious Sonar-like smells: nested ternaries, avoidable duplicated logic, dead code, unused values, stale debug code, mutation of props/parameters, `any`, unsafe assertions, or unnecessarily broad types.
- Repeated logic, configuration, type contracts, and adapters in the touched scope were reviewed; semantic duplication was consolidated at the lowest common owner, and any unsafe or out-of-scope duplication was reported.
- Functions, effects, and handlers are short enough to read without mixing unrelated responsibilities.
- Any remaining Sonar/SonarLint warning that was not safely fixed is reported explicitly.
- Touched TypeScript APIs were checked for deprecations using the repository's automated typed lint gate when available; otherwise their installed declarations were inspected and the automation limitation was reported.
- No deprecated API suppression or allowlist was introduced without an explicit, verified behavioral reason.
- `use<Component>.ts|tsx` contains logic when the component needs a hook; purely visual components may omit it.
- `use<Component>.ts|tsx` is not created merely to return prop bags, static child props, simple className strings, or direct callback forwarding.
- A component whose only logic is consuming an existing custom hook does not gain a redundant `use<Component>` wrapper.
- When a local `use<Component>` exists and the component also translates text, the translation hook lives in `use<Component>` while translation calls remain visible in `index.tsx` through the returned `t` function.
- `styles.module.scss` exists only if styles are needed.
- `constants.ts` exists only if reusable constants or meaningful module configuration exist, and those values are not left as named static declarations in implementation files.
- Every module-level `const` in the touched scope was classified: static configuration is in `constants.ts` or a justified semantic owner, obvious one-off literals are inline, and runtime declarations remain with their implementation.
- `constants.ts` contains no JSX, hooks, components, executable helpers, service construction, side effects, or mutable runtime state.
- `types.ts` exists whenever the component module owns props or any other type, including single-use component types.
- Single-use non-type values remain inline unless extraction clearly improves readability.
- `utils.ts` exists only if helpers exist.
- Imports and filenames are consistent with repo conventions.
- Lint/build checks are run as appropriate for touched files.
- The active test mode is explicit in the final summary.
- `standard` performs no unit-test discovery, execution, creation, modification, audit, or reporting.
- In `strict`, related existing tests were discovered and run when available.
- In `strict`, new or changed behavior has functional tests written first, each observed failing for the expected reason before implementation, and the Red evidence (or declared exception) is reported.
- `strict` mode includes a functional inventory for each new or materially refactored unit.
- In `strict`, each page or component with UI has an `expectNoAccessibilityViolations` assertion (`tests/setup/axe.ts`) in its relevant states.
- `test-audit` produces findings only and leaves the worktree unchanged.
- Unit and component test files remain under `tests/`; shared MSW setup, handlers, and fixtures remain under the root `mocks/` folder when MSW is used.
- Components and component hooks do not import MSW or depend on whether the active backend is mocked or real.
- Any changed MSW handler matches an approved API contract and specification scenario.

## Invocation Guide

You can invoke this skill for a file or a folder.

- File target example:
  - `usa /react-ts-feature-pattern en src/pages/<Page>/components/<Component>/index.tsx`
- Folder target example:
  - `usa /react-ts-feature-pattern en la carpeta src/features/<capability>`
  - `apply /react-ts-feature-pattern to folder src/pages/<Page>`
- Mode examples:
  - `usa /react-ts-feature-pattern en modo standard sobre ComponentName`
  - `usa /react-ts-feature-pattern en modo strict sobre esta carpeta`
  - `usa /react-ts-feature-pattern en modo test-audit; solo analiza, no implementes`

Notes:
- You do not need `@` to target folders.
- A plain absolute folder path in the request is enough.
- Omitting the mode always selects `standard`.
- Unit-test work requires `strict`, `test-audit`, or an explicit user instruction requesting tests.
