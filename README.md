# redux-epic-utils

This library provides utility functions for managing [redux-observable](https://github.com/redux-observable/redux-observable) epics.

This library is still in development

## Documentation

All functions in this library are pure, so no worries about side-effects.

The documentation uses the type `Epic`. The type `Epic` represents an epic function, from the redux-observable type-definition.

### mountOn

**Signature**: mountOn(mountAction: string, unmountAction: string, epic: Epic) -> Epic

**Description**: This utility function mounts and unmounts given epic on certain actions. As long as the epic is mounted, it'll
react to all actions in your action-stream. As long as the epic is not mounted, it won't receive any actions, as the stream is
unsubscribed. An epic is mounted only once.

**Params**:

* mountAction: A string representing the action type that mounts given epic.
* unmountAction: A string representing the action type that unmounts a mounted epic.
* epic: The epic that should get mounted/unmounted on given actions.

**Returns**: An epic you can use just like any other epics.

### triggerOn

**Signature**: triggerOn(triggerAction: string, abortAction: string, epic: Epic) -> Epic

**Description**: This utility function makes given epic triggerable. When the epic gets triggered, it gets executed with just the
trigger action, nothing else. No other actions get dispatched to the given epic. Each trigger action restarts the epic. An abort
action aborts all previous calls by ignoring their results.

This is best used for REST-requests. Each trigger restarts the request, throwing away the results of the previous requests, so you
just get the current result.

**Params**:

* triggerAction: A string representing the action type that triggers given epic.
* abortAction: A string representing the action type that aborts running given epic.
* epic: The epic that should get triggered on given actions.

**Returns**: An epic you can use just like any other epics.
