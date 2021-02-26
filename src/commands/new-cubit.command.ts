import * as changeCase from 'change-case';
import { Thenable, Uri, window, workspace } from 'coc.nvim';
import { existsSync, lstatSync, writeFile } from 'fs';
import _ from 'lodash';
import * as mkdirp from 'mkdirp';
import path from 'path';
import { getCubitStateTemplate, getCubitTemplate } from '../templates';
import { BlocType, getBlocType, TemplateType } from '../utils';

export const newCubit = async (uri: Uri) => {
  const cubitName = await promptForCubitName();
  if (_.isNil(cubitName) || cubitName.trim() === '') {
    window.showErrorMessage('The cubit name must not be empty');
    return;
  }

  let targetDirectory: string | undefined;
  if (_.isNil(_.get(uri, 'fsPath')) || !lstatSync(uri.fsPath).isDirectory()) {
    const d = await promptForTargetDirectory();
    if (_.isNil(d)) {
      window.showErrorMessage('Please type a valid directory');
      return;
    }
    targetDirectory = path.join('lib', d);
  } else {
    targetDirectory = path.join('lib', uri.fsPath);
  }

  const blocType = await getBlocType(TemplateType.Cubit);
  const pascalCaseCubitName = changeCase.pascalCase(cubitName.toLowerCase());
  try {
    await generateCubitCode(cubitName, targetDirectory, blocType);
    window.showInformationMessage(
      `Successfully Generated ${pascalCaseCubitName} Cubit`
    );
  } catch (error) {
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
};

function promptForCubitName(): Thenable<string | undefined> {
  return workspace.callAsync('input', ['Cubit name (example: conter): ']);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
  return workspace.callAsync('input', [
    'Folder path to create the cubit in (example: blocs): ',
  ]);
}

async function generateCubitCode(
  cubitName: string,
  targetDirectory: string,
  type: BlocType
) {
  const cubitDirectoryPath = `${targetDirectory}/cubit`;
  if (!existsSync(cubitDirectoryPath)) {
    await createDirectory(cubitDirectoryPath);
  }

  await Promise.all([
    createCubitStateTemplate(cubitName, targetDirectory, type),
    createCubitTemplate(cubitName, targetDirectory, type),
  ]);
}

function createDirectory(targetDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      mkdirp.sync(targetDirectory);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function createCubitStateTemplate(
  cubitName: string,
  targetDirectory: string,
  type: BlocType
) {
  const snakeCaseCubitName = changeCase.snakeCase(cubitName.toLowerCase());
  const targetPath = `${targetDirectory}/cubit/${snakeCaseCubitName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseCubitName}_state.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitStateTemplate(cubitName, type),
      'utf8',
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }
    );
  });
}

function createCubitTemplate(
  cubitName: string,
  targetDirectory: string,
  type: BlocType
) {
  const snakeCaseCubitName = changeCase.snakeCase(cubitName.toLowerCase());
  const targetPath = `${targetDirectory}/cubit/${snakeCaseCubitName}_cubit.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseCubitName}_cubit.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(
      targetPath,
      getCubitTemplate(cubitName, type),
      'utf8',
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }
    );
  });
}
