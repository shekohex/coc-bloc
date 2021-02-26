import { commands, ExtensionContext, workspace } from 'coc.nvim';
import { analyzeDependencies } from './utils';
import { newBloc, newCubit } from './commands';

export async function activate(context: ExtensionContext): Promise<void> {
  if (workspace.getConfiguration('bloc').get<boolean>('checkForUpdates')) {
    analyzeDependencies();
  }
  context.subscriptions.push(
    commands.registerCommand('coc-bloc.new-bloc', newBloc),
    commands.registerCommand('coc-bloc.new-cubit', newCubit)
  );
}
