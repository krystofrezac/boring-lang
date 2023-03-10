import ohm from 'ohm-js';
import { BoringLangSemantics } from '../grammar.ohm-bundle';
import {
  createInvalidTreeNode,
  createTypeTreeNode,
} from './helpers/createTypeTreeNode';
import { getTupleItemsTypes } from './helpers/getTupleItemsTypes';
import { isTypeNode } from './helpers/isTypeNode';
import { TypeNode, TypeTreeNodeName } from './types';

export const createGetTypeTreeNodeOperation = (
  semantics: BoringLangSemantics,
) =>
  semantics.addOperation<ReturnType<ohm.Node['getTypeTreeNode']>>(
    'getTypeTreeNode',
    {
      NonemptyListOf: (firstItem, _firstItemIterable, tailIterable) =>
        createTypeTreeNode({
          name: TypeTreeNodeName.Block,
          children: [
            firstItem.getTypeTreeNode(),
            ...tailIterable.getTypeTreeNodes(),
          ],
          hasValue: true,
        }),
      EmptyListOf: () =>
        createTypeTreeNode({
          name: TypeTreeNodeName.Block,
          children: [],
          hasValue: true,
        }),

      // expressions
      stringExpression: (_startQuotes, _content, _endQuotes) =>
        createTypeTreeNode({ name: TypeTreeNodeName.String, hasValue: true }),
      numberExpression: _content =>
        createTypeTreeNode({ name: TypeTreeNodeName.Number, hasValue: true }),
      Block: (_startCurly, content, _endCurly) =>
        createTypeTreeNode({
          name: TypeTreeNodeName.Block,
          children: content.getTypeTreeNodes(),
          hasValue: true,
        }),
      TupleExpression: (_startBracket, items, _endBracket) => {
        const itemsTypes = getTupleItemsTypes(items);

        return createTypeTreeNode({
          name: TypeTreeNodeName.Tuple,
          items: itemsTypes,
          hasValue: true,
        });
      },
      FunctionParameter: name =>
        createTypeTreeNode({
          name: TypeTreeNodeName.Parameter,
          parameterName: name.getName(),
        }),
      FunctionValueDeclaration: (
        _startBracket,
        parameters,
        _endBracket,
        returnExpression,
      ) => {
        const parametersTypes = parameters.getTypeTreeNodes();
        const returnType = returnExpression.getTypeTreeNode();

        if (
          parametersTypes.some(parameterType => !isTypeNode(parameterType)) ||
          !isTypeNode(returnType)
        )
          return createInvalidTreeNode();

        const parametersTupleType = createTypeTreeNode({
          name: TypeTreeNodeName.Tuple,
          items: parametersTypes as TypeNode[], // checked above
          hasValue: true,
        });

        return createTypeTreeNode({
          name: TypeTreeNodeName.FunctionDeclaration,
          parameters: parametersTupleType,
          return: returnType,
          hasValue: true,
        });
      },
      FunctionValueCall: (callee, argumentsExpression) => {
        const calleeType = callee.getTypeTreeNode();
        const argumentsType = argumentsExpression.getTypeTreeNode();
        if (
          !isTypeNode(calleeType) ||
          argumentsType.name !== TypeTreeNodeName.Tuple
        )
          return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.FunctionCall,
          callee: calleeType,
          arguments: argumentsType,
          hasValue: true,
        });
      },

      // types
      stringType: _content =>
        createTypeTreeNode({ name: TypeTreeNodeName.String, hasValue: false }),
      numberType: _content =>
        createTypeTreeNode({ name: TypeTreeNodeName.Number, hasValue: false }),
      TupleType: (_startBracket, items, _endBracket) => {
        const itemsTypes = getTupleItemsTypes(items);

        return createTypeTreeNode({
          name: TypeTreeNodeName.Tuple,
          items: itemsTypes,
          hasValue: false,
        });
      },
      FunctionTypeDeclaration: (parametersTuple, returnExpression) => {
        const parametersType = parametersTuple.getTypeTreeNode();
        const returnType = returnExpression.getTypeTreeNode();
        if (
          parametersType.name !== TypeTreeNodeName.Tuple ||
          !isTypeNode(returnType)
        )
          return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.FunctionDeclaration,
          parameters: parametersType,
          return: returnType,
          hasValue: false,
        });
      },
      genericName: (_apostrophe, name) =>
        createTypeTreeNode({
          name: TypeTreeNodeName.Generic,
          genericName: name.getName(),
          hasValue: false,
        }),
      FunctionTypeCall: (callee, argumentsTuple) => {
        const calleeType = callee.getTypeTreeNode();
        const argumentsType = argumentsTuple.getTypeTreeNode();
        if (
          !isTypeNode(calleeType) ||
          argumentsType.name !== TypeTreeNodeName.Tuple
        )
          return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.FunctionCall,
          callee: calleeType,
          arguments: argumentsType,
          hasValue: false,
        });
      },

      // expressions and types
      identifier: identifier =>
        createTypeTreeNode({
          name: TypeTreeNodeName.VariableReference,
          variableName: identifier.sourceString,
        }),

      // variable assignments
      VariableDeclaration_onlyValue: (identifier, valueAssignment) => {
        const valueType = valueAssignment.getTypeTreeNode();
        if (!isTypeNode(valueType)) return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.VariableAssignment,
          variableName: identifier.getName(),
          implicitTypeNode: valueType,
          hasValue: true,
        });
      },
      VariableDeclaration_valueAndType: (
        identifier,
        typeAssignment,
        valueAssignment,
      ) => {
        const typeAssignmentType = typeAssignment.getTypeTreeNode();
        const valueAssignmentType = valueAssignment.getTypeTreeNode();

        if (!isTypeNode(typeAssignmentType) || !isTypeNode(valueAssignmentType))
          return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.VariableAssignment,
          variableName: identifier.getName(),
          explicitTypeNode: typeAssignmentType,
          implicitTypeNode: valueAssignmentType,
          hasValue: true,
        });
      },
      VariableDeclaration_onlyType: (identifier, typeAssignment) => {
        const typeAssignmentType = typeAssignment.getTypeTreeNode();

        if (!isTypeNode(typeAssignmentType)) return createInvalidTreeNode();

        return createTypeTreeNode({
          name: TypeTreeNodeName.VariableAssignment,
          variableName: identifier.getName(),
          explicitTypeNode: typeAssignmentType,
          hasValue: false,
        });
      },
      ValueAssignment: (_assignmentOperator, value) => value.getTypeTreeNode(),
      TypeAssignment: (_typeOperator, value) => value.getTypeTreeNode(),
    },
  );
