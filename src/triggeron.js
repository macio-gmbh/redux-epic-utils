const {ofType} = require('redux-observable');
const {switchMap, takeUntil} = require('rxjs/operators');

/**
 * Manages triggerable epics. Each trigger starts the epic newly, but only the
 * most recent epic stream will retain. If the abort action occurs, the stream
 * gets unsubscribed, and no actions will get delivered
 * @param {string} aTriggerAction
 * @param {string} aAbortAction
 * @param {function} aEpic
 * @return {Observable}
 */
function request(aTriggerAction, aAbortAction, aEpic) {
    return (actions$, ...args) => actions$.pipe(
        ofType(aTriggerAction),
        switchMap(
            () => aEpic(actions$, ...args).pipe(
                takeUntil(actions$.pipe(ofType(aAbortAction)))
            )
        )
    );
}

module.exports = request;
