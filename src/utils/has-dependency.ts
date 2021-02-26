import _ from 'lodash';

import { getPubspec } from './get-pubspec';

export async function hasDependency(dependency: string) {
  const pubspec = await getPubspec();
  const dependencies = _.get(pubspec, 'dependencies', {});
  return _.has(dependencies, dependency);
}
