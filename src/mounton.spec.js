const mountOnModule = require('./mounton');
const {ofType} = require('redux-observable');
const {map} = require('rxjs/operators');
const {TestScheduler} = require('rxjs/testing');

const MOUNT_ACTION = 'mount-action';
const TRIGGER_ACTION = 'trigger-action';
const REACTION_ACTION = 'reaction-action';
const UNMOUNT_ACTION = 'unmount-action';

/**
 * A test epic
 * @param {Stream} actions$
 * @param  {...any} args
 * @return {Stream} The epic stream
 */
function testEpic(actions$, ...args) {
    return actions$.pipe(
        ofType(TRIGGER_ACTION),
        map((action, index) => ({
            type: REACTION_ACTION,
            args,
            action,
            index,
        }))
    );
}

describe('mountOn', () => {
    let mountOnEpic = null;
    let scheduler = null;

    beforeEach(() => {
        mountOnEpic = mountOnModule(MOUNT_ACTION, UNMOUNT_ACTION, testEpic);
        scheduler = new TestScheduler((aActual, aExpected) => expect(aActual).toEqual(aExpected));
    });

    it('should return a function', () => {
        expect(mountOnEpic).toBeInstanceOf(Function);
    });

    it('should not emit any actions if not mounted', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('a-', {
                a: {type: 'something'},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('--');
        });
    });

    it('should not emit the MOUNT_ACTION when mounting', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('a-', {
                a: {type: MOUNT_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('--');
        });
    });

    it('should not emit the UNMOUNT_ACTION when mounting and unmounting', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('ab', {
                a: {type: MOUNT_ACTION},
                b: {type: UNMOUNT_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('--');
        });
    });

    it('should not emit an action when TRIGGER_ACTION happens, but epic is not mounted', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('a-', {
                a: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('--');
        });
    });

    it('should not emit an action when TRIGGER_ACTION happend after the epic was unmounted after mounting', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('abc', {
                a: {type: MOUNT_ACTION},
                b: {type: UNMOUNT_ACTION},
                c: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('---');
        });
    });

    it('should trigger a reaction when TRIGGER_ACTION happens after the epic was mounted', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('ab', {
                a: {type: MOUNT_ACTION},
                b: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('-a', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 0,
                },
            });
        });
    });

    it('should trigger only one reaction when TRIGGER_ACTION happens after multiple mounts', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('abcd', {
                a: {type: MOUNT_ACTION},
                b: {type: MOUNT_ACTION},
                c: {type: MOUNT_ACTION},
                d: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('---a', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 0,
                },
            });
        });
    });

    it('should pass arguments passed to the mount-function down to the mounted epic', () => {
        scheduler.run(({hot, expectObservable}) => {
            const args = [Math.random(), Math.random().toString(26), () => null];
            const action$ = hot('ab', {
                a: {type: MOUNT_ACTION},
                b: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$, ...args);

            expectObservable(output$).toBe('-a', {
                a: {
                    type: REACTION_ACTION,
                    args,
                    action: {type: TRIGGER_ACTION},
                    index: 0,
                },
            });
        });
    });

    it('should pass the trigger action without stripping anything', () => {
        scheduler.run(({hot, expectObservable}) => {
            const triggerAction = {type: TRIGGER_ACTION, payload: [Math.random(), Math.random().toString(26), () => null]};
            const action$ = hot('ab', {
                a: {type: MOUNT_ACTION},
                b: triggerAction,
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('-a', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                    action: triggerAction,
                    index: 0,
                },
            });
        });
    });

    it('should only trigger reactions while the epic is mounted', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('abcd', {
                a: {type: MOUNT_ACTION},
                b: {type: TRIGGER_ACTION},
                c: {type: UNMOUNT_ACTION},
                d: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('-a--', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 0,
                },
            });
        });
    });

    it('should pass each TRIGGER_ACTION to the mounted epic', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('abbb', {
                a: {type: MOUNT_ACTION},
                b: {type: TRIGGER_ACTION},
            });

            const output$ = mountOnEpic(action$);

            expectObservable(output$).toBe('-abc', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 0,
                },
                b: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 1,
                },
                c: {
                    type: REACTION_ACTION,
                    args: [],
                    action: {type: TRIGGER_ACTION},
                    index: 2,
                },
            });
        });
    });
});
