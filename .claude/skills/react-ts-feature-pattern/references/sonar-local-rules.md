# Sonar Local Rules

Use this file as the project-specific overlay for SonarQube for IDE in standalone mode, especially when the user reports warnings from WebStorm without a SonarQube/SonarCloud server.

Precedence:

1. Exact Sonar findings supplied by the user: rule key, file, line, and message.
2. Rules and guidance in this file.
3. The generic Sonar-like checklist in `SKILL.md`.

The goal is to reduce Sonar warnings without changing runtime behavior, data contracts, rendering output, navigation, map interactions, or validation semantics. If a warning cannot be fixed safely in the current scope, leave behavior stable and report the remaining warning.

## Validation Policy

- For pure utility changes, add or update focused unit tests for the affected branches.
- For component or UI-flow changes, run targeted unit tests and a browser smoke test for the affected workflow when feasible.
- For regex/security/parser changes, include positive, negative, and edge-case tests.
- Do not claim a Sonar warning is resolved unless the code was changed intentionally for that rule or the finding was confirmed as a false positive.

## Sonar Rules Adapted For TypeScript

Use these TypeScript rule equivalents when SonarQube for IDE reports them for TypeScript source. The exact finding supplied by the user remains authoritative.

- `typescript:S1788`: Default parameters should be last.
- `typescript:S7785`: Prefer top-level await over using a promise chain.
- `typescript:S7780`: Avoid unnecessary `String.raw` when the template literal does not contain backslashes.
- `typescript:S7781`: Prefer simpler string replacement patterns, including `String#replaceAll()`.
- `typescript:S6594`: Use `RegExp.exec()` when extracting regex matches.
- `typescript:S8786`: Simplify regexes with possible super-linear runtime due to backtracking.
- `typescript:S2068`: Review potentially hard-coded credentials.

Additional applicable rules:

- `typescript:S3776`: Reduce cognitive complexity to the configured threshold.
- `typescript:S1128`: Remove unused imports.
- `typescript:S7770`: Pass an existing function directly when an arrow only forwards its argument.
- `typescript:S3358`: Extract nested ternary operations into independent statements.
- `typescript:S4158`: Review collections that static analysis determines can only be empty.
- `typescript:S2245`: Review pseudorandom number generators used in potentially security-sensitive contexts.
- `typescript:S2004`: Avoid nesting functions more than four levels deep.
- `typescript:S4624`: Avoid nested template literals.
- `typescript:S7778`: Pass consecutive elements to `Array#push()` in a single call.
- `css:S7924`: Ensure text meets minimum contrast requirements against its background.

`typescript:S7781` appears once in the guidance below and is not duplicated.

React and deprecation rules:

- `typescript:S6819`: Prefer a semantic landmark element over an explicit `role="region"` when the region can be represented by named `<section>`, `<nav>`, `<aside>`, or `<main>` markup.
- `typescript:S6845`: Declare `tabIndex` only on genuinely interactive elements or elements with an explicit programmatic-focus contract.
- `typescript:S6747`: Remove unknown JSX properties and attributes from rendered DOM elements.
- `typescript:S1874`: Replace deprecated TypeScript or component APIs with supported equivalents.
- `css:S1874`: Replace deprecated CSS properties or values while preserving computed behavior.

`typescript:S3358` appears once in the guidance below and is not duplicated.

## Rule Guidance

### `typescript:S1788` - Default parameters should be last

Prefer placing parameters with defaults after required parameters.

Good:

```ts
const formatValue = (value, fallback = '-') => {};
```

Avoid:

```ts
const formatValue = (fallback = '-', value) => {};
```

Safety guidance:

- Reordering parameters can be a breaking API change. Search all call sites before changing function signatures.
- If the function is exported or widely used, prefer an options object only when it clearly improves the contract and all call sites can be updated and tested.
- For callbacks passed to external APIs, do not reorder parameters unless the API contract proves it is safe.

### `typescript:S7785` - Prefer top-level await

When a module performs startup preloading with `.then()`, `.catch()`, or a top-level async function call, Sonar may prefer top-level `await`.

Preferred when safe:

```ts
try {
  await preloadOperator();
} catch {
  // Intentionally non-fatal preload.
}
```

Safety guidance:

- Only use top-level `await` when the module is ESM, the bundler supports it, and delaying module evaluation will not change app startup behavior.
- Do not convert fire-and-forget preloading into blocking startup unless that behavior is intended.
- If preserving non-blocking behavior matters, keep the promise chain or async call and report the warning as intentionally deferred.
- After introducing top-level `await`, run unit tests, build, and a browser smoke test for any feature importing the module.
- Replace empty catches with named no-op handlers such as `ignorePreloadError` when the failure is intentionally non-fatal.

### `typescript:S7780` - Avoid unnecessary `String.raw`

Use `String.raw` only when the template literal itself contains backslashes that would otherwise be hard to read or would need escaping.

Good:

```ts
const DIGITS_PATTERN = String.raw`\d+`;
const REGEX = new RegExp(`^${DIGITS_PATTERN}$`);
```

Avoid:

```ts
const SEPARATOR_PATTERN = String.raw`[ ,]{1,2}`;
const REGEX = new RegExp(String.raw`^${DIGITS_PATTERN}$`);
```

Safety guidance:

- Removing `String.raw` is safe only when the affected literal contains no backslashes.
- Keep `String.raw` for fragments such as `\d`, `\s`, `\b`, escaped quotes, or other regex escapes.
- Add or keep regex tests after changing pattern construction.

### `typescript:S7781` - Prefer simpler string replacement

Use `replaceAll` for literal global replacements.

Good:

```ts
value.replaceAll('+', '-').replaceAll('/', '_');
```

Avoid:

```ts
value.replace(/\+/g, '-').replace(/\//g, '_');
```

Safety guidance:

- Use `replaceAll` only for literal replacements.
- Keep `replace` with a regex when the pattern is genuinely regex-based.
- Preserve Unicode and case-sensitivity behavior.

### `typescript:S6594` - Use `RegExp.exec()`

When extracting capture groups, prefer `RegExp.exec(value)` over `value.match(regex)` if Sonar flags it.

Good:

```ts
const match = COORDINATE_PATTERN.exec(value);
```

Safety guidance:

- Avoid `g` or `y` flags for one-shot extraction. If a global/sticky regex is required, reset `lastIndex` before reuse.
- Keep compiled regex constants at module scope when reused.
- Add tests for no-match, partial-match, and successful capture cases.

### `typescript:S8786` - Regex backtracking risk

Avoid regexes with broad nested optional groups, ambiguous repeated groups, or patterns that can grow super-linearly on invalid input.

Prefer:

- small parsing helpers
- splitting into explicit tokens
- anchored, bounded regexes
- separate validation steps
- `String.raw` for readability when many backslashes are needed

Safety guidance:

- Do not "simplify" a regex by making validation weaker.
- Add tests for valid input, invalid input, empty input, malformed long input, and boundary values.
- For user-provided text, prefer predictable linear parsing over clever one-shot regexes.

### `typescript:S2068` - Potential hard-coded credential

Sonar flags names or string values that look like passwords, tokens, or secrets.

Safety guidance:

- If the value is a real secret, remove it from source and read it from configuration or environment.
- If the value is a UI action id, label key, route key, or non-secret test fixture, rename it to avoid secret-like words when that does not change external behavior.
- Do not rename public API fields, backend contract fields, analytics event names, or translation keys just to silence this warning unless all downstream usage is updated and tested.
- If the warning is a false positive and renaming would change a contract, leave it and report it explicitly.

### `typescript:S3776` - Cognitive complexity

Reduce complexity by extracting cohesive decisions into small named helpers and using guard clauses where they clarify the main path.

Safety guidance:

- Preserve evaluation order, side effects, async behavior, and early-return semantics.
- In map and rendering code, keep geometry conversion, selection, hover, and layer updates in the same order unless the behavior change is intentional.
- Do not move mutable render state into module scope merely to lower a score.
- Prefer pure helpers for calculations and small stateful helpers with explicit dependencies for refs, layers, or callbacks.

### `typescript:S1128` - Unused imports

Remove imports that are not referenced by executable code.

Safety guidance:

- Confirm the import is not intentionally required for module side effects before removing it.
- For styles, polyfills, registration modules, and framework bootstrapping, preserve side-effect-only imports even when no binding is referenced.

### `typescript:S7770` - Forwarding arrow functions

Pass the referenced function directly when an arrow function does nothing except forward the same argument.

Good:

```ts
values.map(String);
```

Avoid:

```ts
values.map((value) => String(value));
```

Safety guidance:

- Apply this only when callback arguments beyond the first cannot change behavior. Constructors and functions such as `parseInt` can receive an array index and must not be substituted mechanically.
- Preserve binding when a method depends on its receiver; `items.map(service.format)` is not equivalent to `items.map(service.format.bind(service))`.

### `typescript:S3358` - Nested ternary operations

Replace nested ternaries with a named helper, guard clauses, or explicit statements.

Safety guidance:

- Preserve short-circuit order and lazy evaluation.
- Do not duplicate expensive calls or move calls with side effects outside their original branch.
- A single, flat ternary can remain when it is the clearest representation of a binary choice.

### `typescript:S6747` - Unknown JSX properties and attributes

Remove properties that React does not recognize on the concrete HTML or SVG element being rendered.

Safety guidance:

- Confirm the exact current source location before editing. SonarQube for IDE findings can retain stale line mappings after an unsaved or recent refactor.
- Treat standard React properties such as `className`, supported DOM properties, and valid `aria-*` or `data-*` attributes as valid; reanalyze before changing them when the finding does not name a recognizable property.
- For custom components, inspect whether the prop is consumed or forwarded to the DOM. A custom component prop is not inherently invalid, but it must not leak unchanged to an incompatible native element.
- Remove or rename an attribute only after identifying its intended owner. Use `data-*` only for genuine custom DOM metadata and `aria-*` only according to its accessibility contract.
- Do not change the rendered tag, classes, layout, or interaction contract merely to silence a stale or false-positive location.

### `typescript:S6819` - Prefer semantic landmarks over `role="region"`

When an element uses `role="region"` and has an accessible name, prefer the most specific native landmark that represents its content. Use a named `<section aria-label="...">` or `<section aria-labelledby="...">` for a cohesive generic region when `nav`, `aside`, or `main` would be inaccurate.

Safety guidance:

- Preserve the existing accessible name, classes, DOM order, focusability, refs, event handlers, scrolling, and layout behavior.
- Preserve focusability only when the region owns genuine keyboard interaction or an explicit programmatic-focus contract; scrollability alone does not make a passive wrapper interactive.
- A `<section>` exposes the implicit `region` landmark only when it has an accessible name; retain `aria-label` or a valid `aria-labelledby` reference.
- Prefer `aria-labelledby` when a visible heading inside the same region already provides the intended name; otherwise retain the existing translated `aria-label`.
- Do not convert mechanically when the element is only a styling wrapper or when another landmark such as `nav`, `aside`, or `main` is semantically more accurate.
- Search the full requested React component scope for explicit `role="region"` occurrences and validate every replacement with the existing accessibility query or a browser accessibility snapshot.

### `typescript:S6845` - Restrict `tabIndex` to interactive elements

Remove `tabIndex` from passive layout, landmark, and scroll wrappers that do not own keyboard behavior. If keyboard activation or focus is part of the contract, prefer the appropriate native interactive element; otherwise provide the matching semantic role and keyboard handling only when no native element can represent the interaction.

Safety guidance:

- Do not add `role="button"`, `role="link"`, or another interactive role merely to retain `tabIndex`; the role must match real behavior.
- Preserve `tabIndex` on native controls and on established composite-widget descendants when their ARIA pattern requires managed focus.
- Treat `tabIndex={-1}` as a programmatic-focus contract, not as a generic warning workaround; verify the corresponding focus owner or ref before retaining it.
- For a passive horizontal scroller with no interactive children or keyboard handler, remove `tabIndex` while preserving overflow, touch/pointer scrolling, accessible naming, content order, and layout.
- When keyboard users must operate the scrolling itself, prefer explicit native controls that move the viewport rather than making an otherwise passive container tabbable.
- Search the requested React component scope for every `tabIndex` occurrence and inspect the rendered element and handlers before changing it.

### `typescript:S1874` - Deprecated TypeScript or component APIs

Replace a deprecated API with the supported equivalent documented by the installed dependency version.

Safety guidance:

- Inspect the locally installed type declarations or implementation before changing a third-party component prop; repository dependency versions are authoritative for the current build.
- Run the repository's deprecated-API check over the complete configured TypeScript scope when one exists. For TypeScript repositories using ESLint, prefer a typed `@typescript-eslint/no-deprecated` rule so JSDoc `@deprecated` annotations in application code and dependency declarations fail the normal lint gate.
- If typed linting is not already configured, enable only the type information and deprecation rule required by the repository instead of adopting an unrelated broad preset. Reuse the existing TypeScript project configuration and do not add a second compilation path.
- Do not add allowlists or inline suppressions for a deprecated API unless no supported behaviorally equivalent replacement exists and the exception has an explicit, verified reason.
- Preserve observable behavior, including dimensions, placement, controlled state, callbacks, and cleanup semantics.
- Do not simply remove a deprecated prop when it controls layout or behavior. Migrate its value to the supported replacement and validate with lint and build.
- If the repository cannot run a typed deprecation rule, inspect the exact touched imports, properties, and component props against local declarations and report that automation gap explicitly.
- If no behaviorally equivalent replacement exists, keep the current behavior and report the deprecation instead of guessing a new contract.

### `css:S1874` - Deprecated CSS properties or values

Replace deprecated CSS syntax with standards-based declarations that preserve the effective rendering.

For deprecated `word-break: break-word`, use the explicit equivalent:

```scss
word-break: normal;
overflow-wrap: anywhere;
```

Safety guidance:

- Check inheritance and cascade order before replacing a property; an equivalent declaration may require resetting a related inherited property explicitly.
- Preserve overflow, intrinsic sizing, wrapping, and supported-browser behavior rather than choosing a replacement by name alone.
- Keep the declaration in the same selector unless changing ownership is part of the requested refactor.

### `typescript:S4158` - Collection can only be empty

When a collection is mutated indirectly from another module, encapsulate its reads and writes behind functions owned by the same module so static analysis and maintainers can see the lifecycle.

Safety guidance:

- Do not add dummy entries or unreachable branches to silence the finding.
- Preserve collection scope and lifecycle; avoid changing a module-level registry into React state unless reactivity is actually required.
- Keep identity, cleanup, and iteration behavior unchanged when introducing registry helpers.

### `typescript:S2245` - Pseudorandom number generators

Do not use `Math.random()` for identifiers, tokens, authorization decisions, or other security-relevant values.

Safety guidance:

- Prefer `crypto.randomUUID()` or `crypto.getRandomValues()` when unpredictability is required.
- For a non-security UI fallback that only needs process-local uniqueness, use a monotonic counter combined with an existing stable time or namespace value.
- Document or encode the non-security purpose in the helper name; never present a counter-based fallback as cryptographically secure.

### `typescript:S2004` - Excessive function nesting

Move reusable predicates, event processing, and cohesive inner operations to named helpers when callbacks exceed four levels of function nesting.

Safety guidance:

- Preserve closures deliberately: pass mutable refs, current state, and external dependencies explicitly when extracting a nested function.
- In React effects, keep setup and cleanup ownership together so extracted handlers do not leak subscriptions or capture stale values.
- In map interactions, preserve event order, hit-test scope, highlight cleanup, and async timing.
- Do not replace callbacks with module-level mutable state merely to lower nesting.

### `typescript:S4624` - Nested template literals

Build optional or conditional string fragments in named variables or arrays before interpolating them into the final string.

Good:

```ts
const commandParts = [`ping ${target}`];
if (routerInstance) {
  commandParts.push(`router \"${routerInstance}\"`);
}
const command = commandParts.join(' ');
```

Avoid:

```ts
const command = `ping ${target}${routerInstance ? ` router \"${routerInstance}\"` : ''}`;
```

Safety guidance:

- Preserve the exact separators, whitespace, quoting, and evaluation order of the original string.
- Keep a single template literal when it has no nested template and remains the clearest representation.
- Prefer a named fragment for one optional segment and an array plus `join` for several independently optional segments.
- Do not evaluate an optional expression eagerly when the original conditional interpolation evaluated it lazily.

### `typescript:S7778` - Consecutive `Array#push()` calls

Pass multiple elements to one `push` call when the same array receives several unconditional, consecutive additions.

Good:

```ts
items.push(firstItem, secondItem, thirdItem);
```

Avoid:

```ts
items.push(firstItem);
items.push(secondItem);
items.push(thirdItem);
```

Safety guidance:

- Preserve the original element order.
- Merge only consecutive calls that target the same array and belong to the same unconditional branch.
- Keep calls separate when conditions, intervening mutations, reads, or control flow occur between them.
- Do not merge expressions with side effects when evaluating all arguments before the single mutation could change observable behavior.

### `css:S7924` - Insufficient text contrast

Adjust foreground or background colors so normal text reaches at least a 4.5:1 contrast ratio and large text reaches at least 3:1.

Safety guidance:

- Measure the effective rendered foreground and background, including opacity, overlays, hover states, and framework overrides.
- Preserve the semantic color family and design hierarchy when choosing an accessible replacement.
- Check default, hover, focus, active, disabled, badge, and button states independently.
- Do not hide text, increase opacity unpredictably, or rely on text shadow as a contrast fix.

## Generic Sonar-Like Rules From The Skill

### Control flow and complexity

- Reduce nested `if`/`else`, loops, switches, and callbacks when extraction or early named decisions improves readability.
- Replace nested ternaries with named variables, helper functions, or small render branches.
- Replace small Sonar-flagged `switch` statements with `if` statements only when readability improves and behavior stays identical.
- Avoid duplicated boolean expressions and repeated condition fragments.
- Prefer guard clauses for loading/error/invalid paths when they make the main path easier to read.

### Focused functions

- Split long handlers, validators, mappers, effects, and parsers into named helpers with clear responsibility.
- Keep `useEffect` bodies small; move setup and cleanup helpers out when an effect mixes concerns.
- Avoid large anonymous functions inside JSX.
- Avoid async functions directly as `useEffect` callbacks.

### Duplication and ownership

- Reuse helpers only when the duplicated logic is genuinely the same contract.
- Keep shared helpers in the lowest folder that matches real usage.
- Do not create broad shared utilities only to satisfy a smell.
- Do not invent fallback fields, schema paths, or data contracts during refactors.

### React contracts

- Keep `index.tsx` presentational and thin.
- Extract component logic into `use<Component>.ts|tsx` when local state, effects, derived data, handlers, or orchestration exist.
- Do not create wrapper hooks that only rename another hook's return value.
- Enforce one React component per file.
- Do not declare React components, hooks, or reusable type fragments inside render bodies.
- Use stable React keys from existing data contracts. Use array indexes only for static lists that cannot reorder, add, remove, or filter.
- Keep TypeScript props and callback contracts specific when structure is known. Avoid `any`, unsafe assertions, and unnecessarily broad object or array types.
- Prefer typed parameter/destructuring defaults over `defaultProps` in functional components.

### Accessibility and JSX validity

- Preserve existing rendered tags and visual output unless a semantic tag change is explicitly requested or proven safe.
- For existing non-interactive elements with handlers, resolve accessibility warnings with appropriate role, focusability, and keyboard behavior when that matches the interaction.
- Do not add `tabIndex` as a standalone warning silencer.
- Remove invalid DOM props and move SCSS-like selectors out of inline `style` objects.

### Reliability cleanup

- Remove dead branches, stale comments, debug logs, and commented-out code.
- Avoid mutating props, Redux state, function parameters, or imported constants.
- Name repeated strings or numbers when the name clarifies domain meaning.
- Preserve rendered markup, classes, layout, data contracts, navigation, map behavior, and validation behavior over mechanical warning removal.
