const fs = require('fs')
const { resolve } = require('path')

const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')

const INPUT_CODE = resolve(__dirname, '../demo/dymsg.backup.js')
const OUTPUT_FOLDER = resolve(__dirname, '../output')

const code = fs.readFileSync(`${INPUT_CODE}`, 'utf-8')
const ast = parser.parse(code)

function createFile (filename, code) {
  fs.writeFileSync(`${OUTPUT_FOLDER}/${filename}.js`, code, 'utf-8')
}

function createImportDeclaration (funcName) {
  return t.importDeclaration([t.importDefaultSpecifier(t.identifier(funcName))], t.stringLiteral(`./${funcName}`))
}

traverse(ast, {
  AssignmentExpression ({ node }) {
    const { left, right } = node
    if (left.type === 'MemberExpression' && right.type === 'FunctionExpression') {
      const { object, property } = left
      if (object.property.name === 'prototype') {
        const funcName = property.name
        console.log(funcName)
        const { code: funcCode } = generator(right)
        const replacedNode = t.identifier(funcName)
        node.right = replacedNode

        createFile(funcName, 'export default ' + funcCode)

        ast.program.body.unshift(createImportDeclaration(funcName))
      }
    }
  }
})

createFile('es6code', generator(ast).code)
