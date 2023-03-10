import { test, describe, expect } from 'vitest';
import { checkTypeTree, CheckTypeTreeReturn } from '..';
import { getTypeTree } from '../../getTypeTree';
import { parse } from '../../parser';
import { createSemantics } from '../../semantics';
import { TypeTreeCheckerErrorName } from '../types/errors';
import { CheckerTypeNames } from '../types/types';

const semantics = createSemantics();
const getInput = (code: string) => {
  const adapter = semantics(parse(code));

  return getTypeTree(adapter);
};

describe('assigning to variable - non type checks', () => {
  test('assigning expression', () => {
    const input = getInput('a = 1');
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning existing variable', () => {
    const input = getInput(`
      a = 1
      b = a
    `);
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning non-existing variable', () => {
    const input = getInput('b = a');
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.UnknownIdentifier,
          data: { identifier: 'a' },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('redeclaring variable in the same scope', () => {
    const input = getInput(`
      a = 1
      a = 2
    `);
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.IdentifierAlreadyDeclaredInThisScope,
          data: { identifier: 'a' },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('redeclaring variable in different scope', () => {
    const input = getInput(`
      a = 1
      {
        a = 2
      }
    `);
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning variable without value', () => {
    const input = getInput(`
      a: number 
      b = a
    `);
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.ExpressionWithoutValueUsedAsValue,
          data: {
            expressionType: { name: CheckerTypeNames.Number, hasValue: false },
          },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning variable with value', () => {
    const input = getInput(`
      a: number = 1
      b = a
    `);
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
});
describe('assigning to variable - basic type checks', () => {
  test('assigning same value and type', () => {
    const input = getInput('a: number = 1');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning different value and type', () => {
    const input = getInput('a: string = 1');
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.VariableTypeMismatch,
          data: {
            variableName: 'a',
            expected: { name: CheckerTypeNames.String, hasValue: false },
            received: { name: CheckerTypeNames.Number, hasValue: true },
          },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning different value and type and then assigning again', () => {
    const input = getInput(`
      a: string = 1
      b: string = a 
      `);
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.VariableTypeMismatch,
          data: {
            variableName: 'a',
            expected: { name: CheckerTypeNames.String, hasValue: false },
            received: { name: CheckerTypeNames.Number, hasValue: true },
          },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
});
describe('string', () => {
  test('assigning only value', () => {
    const input = getInput('a = ""');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning only type', () => {
    const input = getInput('a: string');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning same value and type', () => {
    const input = getInput('a: string = ""');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
});
describe('number', () => {
  test('assigning only value', () => {
    const input = getInput('a = 1');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning only type', () => {
    const input = getInput('a: number');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning same value and type', () => {
    const input = getInput('a: number = 1');
    const expected: CheckTypeTreeReturn = {
      errors: [],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
});
describe('block', () => {
  test('assigning block with one expression', () => {
    const input = getInput(`
      a = { 1 } 
    `);
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning block with more expressions', () => {
    const input = getInput(`
      a = { 
        b = 2
        c = b
        c
      } 
    `);
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning block with more expressions and same explicit type', () => {
    const input = getInput(`
      a: number = { 
        b = 2
        c = b
        c
      } 
    `);
    const expected: CheckTypeTreeReturn = { errors: [] };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning block with more expressions and different explicit type', () => {
    const input = getInput(`
      a: string = { 
        b = 2
        c = b
        c
      } 
    `);
    const expected: CheckTypeTreeReturn = {
      errors: [
        {
          name: TypeTreeCheckerErrorName.VariableTypeMismatch,
          data: {
            expected: {
              name: CheckerTypeNames.String,
              hasValue: false,
            },
            received: {
              name: CheckerTypeNames.Number,
              hasValue: true,
            },
            variableName: 'a',
          },
        },
      ],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
  test('assigning block with no expression', () => {
    const input = getInput(`
      a = { } 
    `);
    const expected: CheckTypeTreeReturn = {
      errors: [{ name: TypeTreeCheckerErrorName.EmptyBlock, data: {} }],
    };
    const result = checkTypeTree(input);
    expect(result).toEqual(expected);
  });
});
