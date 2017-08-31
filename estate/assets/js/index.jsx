import "react-hot-loader/patch"
import React from "react" // eslint-disable-line no-unused-vars
import ReactDOM from "react-dom"
import { AppContainer } from "react-hot-loader"
import { createStore, compose, combineReducers } from "redux"
import { Provider } from "react-redux"
import persistState from "redux-localstorage"
import { BrowserRouter } from "react-router-dom"
import rootReducer from "./reducers/index"
import App from "./components/App"
import "./estate.css"

window.jsyaml = require("js-yaml") // eslint-disable-line no-undef

const composeEnhancers = typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({}) : compose

export default function configureStore () {
    const reducer = combineReducers(rootReducer)
    const enhancer = composeEnhancers(persistState("messages"))
    return createStore(reducer, window.__STATE__, enhancer)
}

const store = configureStore()
window.dispatch = store.dispatch
store.dispatch({ type: "INIT" })

const render = (Component) =>
    ReactDOM.render(
        <AppContainer>
            <Provider store={store}>
                <BrowserRouter>
                    <Component />
                </BrowserRouter>
            </Provider>
        </AppContainer>,
        document.getElementById("root")
    )

render(App)
if (module.hot) module.hot.accept("./components/App", () => render(App)) // eslint-disable-line no-undef
