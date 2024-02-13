const astString = Deno.readTextFileSync('./ast.json');
const ast = JSON.parse(astString);

type JSONValue = string | number | boolean | { [key: string]: JSONValue } | Array<JSONValue>;

interface IfParameters {}

type Parameters = { kind: 'if'; arguments: IfParameters };

interface AST {
  order: number; // number
  name: string; // name
  type: string; // keyword
  parameters: JSONValue; // input
  children?: AST[]; // block
}

function walkAST(ast: JSONValue) {
  const entries = Object.entries(ast);

  const result: AST = {
    order: -1,
    name: 'root',
    parameters: {},
    type: 'function',
    children: []
  };

  for (const [key, val] of entries) {
    switch (key) {
      case 'number':
        result.order = val;
        break;
      case 'result_schema_json':
      case 'parameters_schema_json':
        result.parameters = JSON.parse(val);
        break;

      case 'block':
        walkAST(val);
        break;
      default:
        break;
    }
  }
}

const parsedAST = walkAST(ast);
Deno.writeTextFileSync('./result.json', JSON.stringify(parsedAST));
