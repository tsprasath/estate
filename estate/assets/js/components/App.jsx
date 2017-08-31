import React from "react"
import { Route } from "react-router-dom"
import Nav from "./Nav"
import Messages from "./Messages"
import Home from "./Home"
import TerraformRoutes from "./TerraformRoutes"


export default class App extends React.Component {
    render () {
        return (
            <div>
                <Nav />
                <Messages />
                <div className="container-fluid">
                    <div className="row">
                        <Route exact path="/" component={Home} />
                        <Route path="/terraform/" component={TerraformRoutes} />
                    </div>
                </div>
            </div>
        )
    }
}


