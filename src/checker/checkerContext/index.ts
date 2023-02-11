import { CheckerContext, TypeScope, Variable, Error } from '../types';
import { getCheckContextDefaultVariables } from './defaultVariables';

export const createCheckerContext = (): CheckerContext => {
  const genericIdCounterDefault = 0;
  const { genericIdCounter, defaultVariables } =
    getCheckContextDefaultVariables(genericIdCounterDefault);

  const typeScopes: TypeScope[] = [
    {
      variables: defaultVariables,
    },
  ];
  const errors: Error[] = [];

  return { typeScopes, errors, genericIdCounter };
};

export const pushTypeScope = (context: CheckerContext) => {
  context.typeScopes.push({ variables: [] });
};
export const popTypeScope = (context: CheckerContext) => {
  context.typeScopes.pop();
};

export const addVariableToCurrentScope = (
  context: CheckerContext,
  variable: Variable,
) => {
  const lastScope = context.typeScopes[context.typeScopes.length - 1];
  if (lastScope) lastScope.variables.push(variable);
};
export const findVariableFromCurrentScope = (
  context: CheckerContext,
  name: string,
) =>
  context.typeScopes
    .flatMap(typeScope => typeScope.variables)
    .reverse()
    .find(variable => variable.name === name);
export const findVariableInCurrentScope = (
  context: CheckerContext,
  name: string,
) => {
  const typeScope = context.typeScopes[context.typeScopes.length - 1];
  if (!typeScope) return undefined;
  const foundVariable = typeScope.variables.find(
    variable => variable.name === name,
  );
  if (foundVariable) return foundVariable;
  return undefined;
};
export const addError = (context: CheckerContext, error: Error) => {
  context.errors.push(error);
};
export const getNewGenericsId = (context: CheckerContext) => {
  const current = context.genericIdCounter;
  context.genericIdCounter++;
  return current;
};
