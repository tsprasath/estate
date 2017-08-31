import { set } from "lodash/fp"
import { createReducer } from "./utils"

var initialState = {
    text: ""
}

export default createReducer(initialState, {
    ["SET_SEARCH"]: (state, action) => {
        state = set(["text"])(action.payload)(state)
        return state
    },
})
