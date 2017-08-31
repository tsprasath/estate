/**
 * Utility function that lets us express reducers as
 * object mapping from action types to handlers.
 *
 * @param  {Any} initialState
 * @param  {Object} handlers
 * @return {Function}
 */

export function createReducer (initialState, handlers) {
    return function reducer (state = initialState, action) {
        if (handlers.hasOwnProperty((action.type))) {
            return handlers[action.type](state, action)
        } else if (action.type === "INIT") {
            return { ...initialState }
        }
        return state
    }
}
