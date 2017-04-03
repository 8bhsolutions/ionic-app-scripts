import {
  ArrayLiteralExpression,
  BinaryExpression,
  ExpressionStatement,
  Identifier,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind } from 'typescript';

import { Logger } from '../logger/logger';
import { MagicString } from '../util/interfaces';
import { findNodes, getTypescriptSourceFile } from '../util/typescript-utils';


export function purgeStaticFieldDecorators(filePath: string, originalFileContent: string, ionicAngularDir: string, angularDir: string, srcDir: string, magicString: MagicString) {
  if (filePath.indexOf(angularDir) >= 0 || filePath.indexOf(ionicAngularDir) >= 0 || filePath.indexOf(srcDir) >= 0) {
    Logger.debug(`[decorators] purgeStaticFieldDecorators: processing ${filePath} ...`);
    const typescriptFile = getTypescriptSourceFile(filePath, originalFileContent);
    const decoratorExpressionStatements = getDecoratorsExpressionStatements(typescriptFile);
    removeDecorators(decoratorExpressionStatements, magicString);
    const propDecoratorsExpressionStatements = getPropDecoratorsExpressionStatements(typescriptFile);
    removePropDecorators(propDecoratorsExpressionStatements, magicString);
    Logger.debug(`[decorators] purgeStaticFieldDecorators: processing ${filePath} ... DONE`);
  }
  return magicString;
}

function getDecoratorsExpressionStatements(typescriptFile: SourceFile) {
  const expressionStatements = findNodes(typescriptFile, typescriptFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
  const decoratorExpressionStatements: ExpressionStatement[] = [];
  for (const expressionStatement of expressionStatements) {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).left && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name &&  ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name.text === 'decorators') {
      decoratorExpressionStatements.push(expressionStatement);
    }
  }
  return decoratorExpressionStatements;
}

function getPropDecoratorsExpressionStatements(typescriptFile: SourceFile) {
  const expressionStatements = findNodes(typescriptFile, typescriptFile, SyntaxKind.ExpressionStatement, false) as ExpressionStatement[];
  const decoratorExpressionStatements: ExpressionStatement[] = [];
  for (const expressionStatement of expressionStatements) {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).left && ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name &&  ((expressionStatement.expression as BinaryExpression).left as PropertyAccessExpression).name.text === 'propDecorators') {
      decoratorExpressionStatements.push(expressionStatement);
    }
  }
  return decoratorExpressionStatements;
}

function removeDecorators(decoratorExpressionStatements: ExpressionStatement[], magicString: MagicString) {
  decoratorExpressionStatements.forEach(expressionStatement => {
    if (expressionStatement.expression && (expressionStatement.expression as BinaryExpression).right && ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements) {
      const numPotentialNodesToRemove = ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements.length;
      const objectLiteralsToPurge: ObjectLiteralExpression[] = [];
      ((expressionStatement.expression as BinaryExpression).right as ArrayLiteralExpression).elements.forEach((objectLiteral: ObjectLiteralExpression) => {
        if (objectLiteral.properties && objectLiteral.properties.length > 1) {
          if (objectLiteral.properties[0].name && (objectLiteral.properties[0].name as Identifier).text === 'type'
            && canRemoveDecoratorNode(((objectLiteral.properties[0] as PropertyAssignment).initializer as Identifier).text)) {
              // sweet, we can remove the object literal
              objectLiteralsToPurge.push(objectLiteral);
          }
        }
      });
      if (objectLiteralsToPurge.length === numPotentialNodesToRemove) {
        // we are removing all decorators, so just remove the entire expression node
        magicString.overwrite(expressionStatement.pos, expressionStatement.end, '');
      } else {
        // we are removing a subset of decorators, so remove the individual object literal findNodes
        objectLiteralsToPurge.forEach(objectLiteralToPurge => {
          magicString.overwrite(objectLiteralToPurge.pos, objectLiteralToPurge.end, '');
        });
      }
    }
  });
}

function removePropDecorators(propDecoratorExpressionStatements: ExpressionStatement[], magicString: MagicString) {
  propDecoratorExpressionStatements.forEach(expressionStatement => {
    magicString.overwrite(expressionStatement.pos, expressionStatement.end, '');
  });
}

function canRemoveDecoratorNode(decoratorType: string) {
  if (decoratorType === COMPONENT) {
    return true;
  } else if (decoratorType === CONTENT_CHILD_DECORATOR) {
    return true;
  } else if (decoratorType === CONTENT_CHILDREN_DECORATOR) {
    return true;
  } else if (decoratorType === DIRECTIVE_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_BINDING_DECORATOR) {
    return true;
  } else if (decoratorType === HOST_LISTENER_DECORATOR) {
    return true;
  } else if (decoratorType === INPUT_DECORATOR) {
    return true;
  } else if (decoratorType === NG_MODULE_DECORATOR) {
    return true;
  } else if (decoratorType === OUTPUT_DECORATOR) {
    return true;
  } else if (decoratorType === PIPE_DECORATOR) {
    return true;
  } else if (decoratorType === VIEW_CHILD_DECORATOR) {
    return true;
  } else if (decoratorType === VIEW_CHILDREN_DECORATOR) {
    return true;
  }
  return false;
}

export const COMPONENT = 'Component';
export const CONTENT_CHILD_DECORATOR = 'ContentChild';
export const CONTENT_CHILDREN_DECORATOR = 'ContentChildren';
export const DIRECTIVE_DECORATOR = 'Directive';
export const HOST_DECORATOR = 'Host';
export const HOST_BINDING_DECORATOR = 'HostBinding';
export const HOST_LISTENER_DECORATOR = 'HostListener';
export const INPUT_DECORATOR = 'Input';
export const NG_MODULE_DECORATOR = 'NgModule';
export const OUTPUT_DECORATOR = 'Output';
export const PIPE_DECORATOR = 'Pipe';
export const VIEW_CHILD_DECORATOR = 'ViewChild';
export const VIEW_CHILDREN_DECORATOR = 'ViewChildren';
