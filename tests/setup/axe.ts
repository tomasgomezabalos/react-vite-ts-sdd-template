import axe from 'axe-core'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const formatViolations = (violations: axe.Result[]): string =>
  violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')
      return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} [${targets}]`
    })
    .join('\n')

export const expectNoAccessibilityViolations = async (
  container: Element,
): Promise<void> => {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_TAGS },
    rules: { 'color-contrast': { enabled: false } },
  })

  if (results.violations.length > 0) {
    throw new Error(
      `Accessibility violations found:\n${formatViolations(results.violations)}`,
    )
  }
}
