const triggerOnModule = require('./triggeron');
const {of} = require('rxjs');
const {delay} = require('rxjs/operators');
const {TestScheduler} = require('rxjs/testing');

const TRIGGER_ACTION = 'trigger-action';
const REACTION_ACTION = 'reaction-action';
const ABORT_ACTION = 'abort-action';

/**
 * A test epic
 * @param {Stream} actions$
 * @param  {...any} args
 * @return {Stream} The epic stream
 */
function testEpic(actions$, ...args) {
    return of({type: REACTION_ACTION, args}).pipe(
        delay(2)
    );
}

describe('triggerOn', () => {
    let triggerOnEpic = null;
    let scheduler = null;

    beforeEach(() => {
        triggerOnEpic = triggerOnModule(TRIGGER_ACTION, ABORT_ACTION, testEpic);
        scheduler = new TestScheduler((aActual, aExpected) => expect(aActual).toEqual(aExpected));
    });

    test('The module should export a function', () => {
        expect(triggerOnModule).toBeInstanceOf(Function);
    });

    it('should not emit the abort action if passed', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('a---', {
                a: {type: ABORT_ACTION},
            });

            const output$ = triggerOnEpic(action$);

            expectObservable(output$).toBe('----');
        });
    });

    it('should trigger the epic when TRIGGER_ACTION occurs', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('a--', {
                a: {type: TRIGGER_ACTION},
            });

            const output$ = triggerOnEpic(action$);

            expectObservable(output$).toBe('--a', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                },
            });
        });
    });

    it('should throw away the results if ABORT_ACTION occurs after TRIGGER_ACTION but before result', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('ab--', {
                a: {type: TRIGGER_ACTION},
                b: {type: ABORT_ACTION},
            });

            const output$ = triggerOnEpic(action$);

            expectObservable(output$).toBe('----');
        });
    });

    it('should pass only one result for multiple TRIGGER_ACTIONS', () => {
        scheduler.run(({hot, expectObservable}) => {
            const action$ = hot('ab----', {
                a: {type: TRIGGER_ACTION},
                b: {type: TRIGGER_ACTION},
            });

            const output$ = triggerOnEpic(action$);

            expectObservable(output$).toBe('---a--', {
                a: {
                    type: REACTION_ACTION,
                    args: [],
                },
            });
        });
    });

    it('should pass given arguments to the epic', () => {
        scheduler.run(({hot, expectObservable}) => {
            const args = [Math.random(), Math.random().toString(26), () => null];
            const action$ = hot('a---', {
                a: {type: TRIGGER_ACTION},
            });

            const output$ = triggerOnEpic(action$, ...args);

            expectObservable(output$).toBe('--a-', {
                a: {
                    type: REACTION_ACTION,
                    args,
                },
            });
        });
    });
});
