import { TypeTreeNodeName } from '../../getTypeTree/types';
import { CheckTypeTreeNode } from '../types';
import { CheckerTypeNames } from '../types/types';
import { getCheckNodeReturn } from './helpers/getCheckNodeReturn';

export const checkNumberNode: CheckTypeTreeNode<TypeTreeNodeName.Number> = (
  context,
  number,
) =>
  getCheckNodeReturn(context, {
    name: CheckerTypeNames.Number,
    hasValue: number.hasValue,
  });
