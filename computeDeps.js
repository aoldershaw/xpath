const xpath = require('.');
const dom = require('xmldom').DOMParser;

const FILE = '/Users/aidanoldershaw/JetUML-2.3/srcml.xml';
const fs = require('fs');

const xml = fs.readFileSync(FILE).toString();
const doc = new dom().parseFromString(xml);

const basePackage = 'ca/mcgill/cs/jetuml'.split('/');

function fileVariable(isSourceUnit) {
  return isSourceUnit ? "@filename" : 'string()';
}

function joinPackageParts(isSourceUnit, parts) {
  const joiner = isSourceUnit ? '/' : '\\.';
  const s = parts.join(joiner);
  return isSourceUnit ? 'src/' + s : 'import (static )?' + s;
}

function matches(package) {
  const parts = basePackage.concat(package.split('/'));
  return function (isSourceUnit) {
    return `matches(${fileVariable(isSourceUnit)}, '${joinPackageParts(isSourceUnit, parts)}')`;
  }
}

function oneOf(regexs) {
  return '(' + regexs.map(r => `(${r})`).join('|') + ')';
}

const modules = [
  {
    name: 'Diagram Builders',
    matcher: matches('diagram/builder/[A-Za-z0-9]+Builder')
  },
  {
    name: 'Constraints',
    matcher: matches('diagram/builder/constraints/.*')
  },
  {
    name: 'Diagram Model',
    matcher: matches('diagram/(?!builder).*')
  },
  {
    name: 'Persistence',
    matcher: matches('persistence/.*')
  },
  {
    name: 'Diagram Views',
    matcher: matches('views/.*'),
  },
  {
    name: 'GUI Entities',
    matcher: matches(oneOf(['gui/DiagramCanvas', 'gui/DiagramTabToolBar', 'gui/EditorFrame', 'gui/Property.*', 'gui/SelectableToolButton', 'gui/ViewportProjection', 'gui/WelcomeTab'])),
  },
  {
    name: 'Diagram Interaction',
    matcher: matches(oneOf(['gui/DiagramCanvasController', 'gui/DiagramTab', 'gui/NewDiagramHandler'])),
  },
  {
    name: 'Operation Processing',
    matcher: matches(oneOf(['diagram/builder/.*Operation.*', 'application/.*Tracker'])),
  },
  {
    name: 'Selection',
    matcher: matches(oneOf(['gui/Selection.*', 'application/Clipboard'])),
  },
  {
    name: 'Main Application',
    matcher: matches('gui/EditorFrame'),
  }
];

const fileCounts = [];
const dependencyMatrix = [];

for (const {matcher} of modules) {
  const numFiles = xpath.select(`count(/unit/unit[${matcher(true)}])`, doc);
  fileCounts.push(numFiles);
  const row = [];
  for (const {matcher: otherMatcher} of modules) {
    // console.log(`/unit/unit[${matcher(true)}]/import[${otherMatcher(false)}]`);
    const result = xpath.select(`/unit/unit[${matcher(true)}]/import[${otherMatcher(false)}]`, doc).length;
    row.push(result);
  }
  dependencyMatrix.push(row);
}

console.log(modules.map(m => m.name).join('\n'));
console.log(fileCounts);
console.log(dependencyMatrix.map(row => row.join(',')).join('\n'));