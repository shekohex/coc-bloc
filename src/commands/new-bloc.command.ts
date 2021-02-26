import * as changeCase from 'change-case';
import { Thenable, Uri, window, workspace } from 'coc.nvim';
import { existsSync, lstatSync, writeFile } from 'fs';
import _ from 'lodash';
import * as mkdirp from 'mkdirp';
import path from 'path';
import {
  getBlocEventTemplate,
  getBlocStateTemplate,
  getBlocTemplate,
} from '../templates';
import { BlocType, getBlocType, TemplateType } from '../utils';

export const newBloc = async (uri: Uri) => {
  const blocName = await promptForBlocName();
  if (_.isNil(blocName) || blocName.trim() === '') {
    window.showErrorMessage('The bloc name must not be empty');
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

  const blocType = await getBlocType(TemplateType.Bloc);
  const pascalCaseBlocName = changeCase.pascalCase(blocName.toLowerCase());
  try {
    await generateBlocCode(blocName, targetDirectory, blocType);
    window.showInformationMessage(
      `Successfully Generated ${pascalCaseBlocName} Bloc`
    );
  } catch (error) {
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
};

function promptForBlocName(): Thenable<string | undefined> {
  return workspace.callAsync('input', ['Bloc name (example: conter): ']);
}

async function promptForTargetDirectory(): Promise<string | undefined> {
  return workspace.callAsync('input', [
    'Folder path to create the bloc in (example: blocs): ',
  ]);
}

async function generateBlocCode(
  blocName: string,
  targetDirectory: string,
  type: BlocType
) {
  const blocDirectoryPath = `${targetDirectory}/bloc`;
  if (!existsSync(blocDirectoryPath)) {
    await createDirectory(blocDirectoryPath);
  }

  await Promise.all([
    createBlocEventTemplate(blocName, targetDirectory, type),
    createBlocStateTemplate(blocName, targetDirectory, type),
    createBlocTemplate(blocName, targetDirectory, type),
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

function createBlocEventTemplate(
  blocName: string,
  targetDirectory: string,
  type: BlocType
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_event.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_event.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(
      targetPath,
      getBlocEventTemplate(blocName, type),
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

function createBlocStateTemplate(
  blocName: string,
  targetDirectory: string,
  type: BlocType
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_state.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_state.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(
      targetPath,
      getBlocStateTemplate(blocName, type),
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

function createBlocTemplate(
  blocName: string,
  targetDirectory: string,
  type: BlocType
) {
  const snakeCaseBlocName = changeCase.snakeCase(blocName.toLowerCase());
  const targetPath = `${targetDirectory}/bloc/${snakeCaseBlocName}_bloc.dart`;
  if (existsSync(targetPath)) {
    throw Error(`${snakeCaseBlocName}_bloc.dart already exists`);
  }
  return new Promise<void>(async (resolve, reject) => {
    writeFile(targetPath, getBlocTemplate(blocName, type), 'utf8', (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
