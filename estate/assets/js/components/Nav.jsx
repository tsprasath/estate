import React from "react"
import { NavLink, Link } from "react-router-dom"
import Search from "./Search"

export default class Nav extends React.Component {
    render () {
        return (
            <nav className="navbar navbar-inverse navbar-fixed-top">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <NavLink className="navbar-brand" to="/"> Estate </NavLink>
                </div>
                <div id="navbar" className="collapse navbar-collapse">
                    <ul className="nav navbar-nav">
                        <li className="dropdown">
                            <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Terraform <span className="caret"></span></a>
                            <ul className="dropdown-menu">
                                <li><Link className="item" to="/terraform/templates">Templates</Link></li>
                                <li><Link className="item" to="/terraform/namespaces">Namespaces</Link></li>
                                <li role="separator" className="divider"></li>
                                <li><a href="https://www.terraform.io/docs/index.html">Documentation</a></li>
                            </ul>
                        </li>
                        <li><a href="/api/"> API Docs </a></li>
                        <li><a href="/admin/"> Administration </a></li>
                    </ul>
                    <div className="navbar-form navbar-right" style={{marginRight: "20px"}}>
                        <Search />
                    </div>
                </div>
            </nav>
        )
    }
}
