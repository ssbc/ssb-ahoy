const toCSS = require('micro-css')

// NOTE this module expects all components to be of the form
// Component - named function (name unique among all components)
// Component.style - String of mcss / css
// Component.components - Array of any Component functions this component uses

function componentCSS (component) {
  const collection = getComponentStyles(component)
  return toCSS(Object.values(collection).join('\n'))
}

function getComponentStyles (component) {
  const collector = {}
  if (component.style) collector[component.name] = component.style

  if (component.components) {
    const childStyles = component.components.map(getComponentStyles)
    Object.assign(collector, ...childStyles)
  }

  return collector
}

module.exports = componentCSS
