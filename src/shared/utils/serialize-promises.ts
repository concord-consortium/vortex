// adapted from https://decembersoft.com/posts/promises-in-serial-with-array-reduce/
export function serializePromises<T>(promises: Promise<T>[], sleep: number = 0) {
  return promises.reduce((promiseChain, currentPromise) => {
    return promiseChain.then(chainResults =>
      currentPromise
        .then(currentResult => new Promise<T>(resolve => setTimeout(() => resolve(currentResult), sleep))
        .then(_currentResult => [ ...chainResults, _currentResult ])
    ));
  }, Promise.resolve([]));
}