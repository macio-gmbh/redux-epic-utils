const {ofType} = require('redux-observable');
const {exhaustMap, takeUntil} = require('rxjs/operators');

/**
 * Mounts given epic on mountaction, and unmounts it on unmount action
 * @param {string} aMountAction
 * @param {string} aUnmountAction
 * @param {function} aEpic,
 * @return {Observable}
 */
function mountOn(aMountAction, aUnmountAction, aEpic) {
    return (actions$, ...args) => actions$.pipe(
        ofType(aMountAction),
        exhaustMap(
            () => aEpic(actions$, ...args).pipe(
                takeUntil(actions$.pipe(ofType(aUnmountAction)))
            )
        )
    );
}

module.exports = mountOn;
