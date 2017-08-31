import { set, unset } from "lodash/fp"
import { findIndex, toNumber } from "lodash"
import { createReducer } from "./utils"

var initialState = {
    loading: {
        namespaces: false,
        templates: false,
    },
    namespaces: [],
    namespacesPage: 0,
    namespacesPages: 0,
    planOutput: "",
    applyOutput: "",
    files: [],
    templates: [],
    renderedTemplate: "{}",
    templatesPage: 0,
    templatesPages: 0,
}

export default createReducer(initialState, {
    ["LOADING_NAMESPACES"]: (state) => {
        state = set(["loading", "namespaces"])(true)(state)
        return state
    },
    ["LOADING_NAMESPACES_DONE"]: (state) => {
        state = set(["loading", "namespaces"])(false)(state)
        return state
    },
    ["LIST_NAMESPACES"]: (state, action) => {
        state = unset(["namespaces"])(state)
        state = set(["namespaces"])(action.payload.namespaces)(state)
        state = set(["namespacesPage"])(toNumber(action.payload.namespacesPage))(state)
        state = set(["namespacesPages"])(toNumber(action.payload.namespacesPages))(state)
        return state
    },
    ["UPDATE_NAMESPACE"]: (state, action) => {
        var index = findIndex(state.namespaces, {"slug": action.payload.slug})
        if (index != -1){
            state = set(["namespaces", index])(action.payload)(state)
        } else {
            state = set(["namespaces", state.namespaces.length])(action.payload)(state)
        }
        return state
    },

    ["DELETE_NAMESPACE"]: (state, action) => {
        var index = findIndex(state.namespaces, {"pk": action.payload})
        if (index != -1){
            state = unset(["namespaces", index])(state)
        }
        return state
    },

    ["CLEAR_PLAN_NAMESPACE"]: (state) => {
        state = set(["planOutput"])({})(state)
        return state
    },

    ["PLAN_NAMESPACE"]: (state, action) => {
        state = set(["planOutput"])(action.payload)(state)
        return state
    },

    ["CLEAR_APPLY_NAMESPACE"]: (state) => {
        state = set(["applyOutput"])({})(state)
        return state
    },

    ["APPLY_NAMESPACE"]: (state, action) => {
        state = set(["applyOutput"])(action.payload)(state)
        return state
    },

    ["UPDATE_FILE"]: (state, action) => {
        var index = findIndex(state.file, {"pk": action.payload.pk})
        if (index != -1){
            state = set(["files", index])(action.payload)(state)
        } else {
            state = set(["files", state.files.length])(action.payload)(state)
        }
        return state
    },

    ["DELETE_FILE"]: (state, action) => {
        var index = findIndex(state.files, {"pk": action.payload})
        if (index != -1){
            state = unset(["files", index])(state)
        }
        return state
    },

    ["LOADING_TEMPLATES"]: (state) => {
        state = set(["loading", "templates"])(true)(state)
        return state
    },
    ["LOADING_TEMPLATES_DONE"]: (state) => {
        state = set(["loading", "templates"])(false)(state)
        return state
    },
    ["LIST_TEMPLATES"]: (state, action) => {
        state = unset(["templates"])(state)
        state = set(["templates"])(action.payload.templates)(state)
        state = set(["templatesPage"])(toNumber(action.payload.templatesPage))(state)
        state = set(["templatesPages"])(toNumber(action.payload.templatesPages))(state)
        return state
    },
    ["UPDATE_TEMPLATE"]: (state, action) => {
        var index = findIndex(state.templates, {"slug": action.payload.slug})
        if (index != -1){
            state = set(["templates", index])(action.payload)(state)
        } else {
            state = set(["templates", state.templates.length])(action.payload)(state)
        }
        return state
    },

    ["DELETE_TEMPLATE"]: (state, action) => {
        var index = findIndex(state.templates, {"pk": action.payload})
        if (index != -1){
            state = unset(["templates", index])(state)
        }
        return state
    },

    ["RENDER_TEMPLATE"]: (state, action) => {
        state = set(["renderedTemplate"])(action.payload)(state)
        return state
    },
})
