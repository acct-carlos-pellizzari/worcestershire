type JSONValue = string | number | boolean | { [key: string]: JSONValue } | Array<JSONValue>;

type Property =
  | {
      control_type: string;
      label: string;
      type: 'string' | 'integer' | 'float' | 'boolean';
      name: string;
      optional: boolean;
    }
  | {
      control_type: string;
      label: string;
      type: 'object';
      name: string;
      optional: boolean;
      properties: Property[];
    }
  | {
      control_type: string;
      label: string;
      type: 'array';
      of: 'object';
      name: string;
      optional: boolean;
      properties: Property[];
    }
  | {
      control_type: string;
      label: string;
      type: 'array';
      of: 'string' | 'integer' | 'float' | 'boolean';
      name: string;
      optional: boolean;
    };

function pipe(input: any, ...fns: ((...args: any[]) => {})[]) {
  if (fns.length === 0) return input;

  const [currFn, ...tail] = fns;

  const result = (() => {
    if (currFn instanceof Array) {
      const [fn, ...args] = currFn;
      return input[fn](...args);
    }
    return currFn(input);
  })();

  return pipe(result, ...tail);
}

function parseProperties(properties: Property[]): JSONValue {
  return properties.reduce((acc, prop) => {
    switch (prop.type) {
      case 'object':
        return {
          ...acc,
          [prop.name]: parseProperties(prop.properties)
        };

      case 'array':
        return {
          ...acc,
          [prop.name]: [prop.of === 'object' ? parseProperties(prop.properties) : prop.of]
        };

      default:
        return {
          ...acc,
          [prop.name]: prop.type
        };
    }
  }, {});
}

const schemaFile = Deno.args[0];
const interfaceName = schemaFile.split('.')[0];

const schema = pipe(schemaFile, Deno.readTextFileSync, JSON.parse, parseProperties);

const contents = JSON.stringify(schema, null, 2)
  .replace(/"/g, '')
  .replace(/,/g, '')
  .replace(/integer/g, 'number')
  .replace(/float/g, 'number')
  .replace(/date_time/g, 'Date')
  .replace(/\[\n\s+(\{.+?})\n\s+]/gs, '$1[]')
  .replace(/((?:\: \w+|}|])$)/gm, '$1;');

const fileContents = `export default interface ${interfaceName} ${contents}`;

Deno.writeTextFileSync(`${interfaceName}.ts`, fileContents);

// deno run --allow-read --allow-write parseSchema.ts <nome do arquivo com extensão>
// o nome do JSON é usado na declaração da interface e no arquivo gerado
