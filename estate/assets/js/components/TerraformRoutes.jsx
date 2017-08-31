import React from "react"
import { Route } from "react-router-dom"
import TerraformTemplateList from "./TerraformTemplateList"
import TerraformTemplateItem from "./TerraformTemplateItem"
import TerraformNamespaceList from "./TerraformNamespaceList"
import TerraformNamespaceItem from "./TerraformNamespaceItem"

export default class TerraformRoutes extends React.Component {
    render () {
        var url = this.props.match.url
        return (
            <div>
                <Route exact path={`${url}/templates`} component={TerraformTemplateList} />
                <Route path={`${url}/templates/:template`} component={TerraformTemplateItem} />
                <Route exact path={`${url}/namespaces`} component={TerraformNamespaceList} />
                <Route path={`${url}/namespaces/:namespace`} component={TerraformNamespaceItem} />
            </div>
        )
    }
}
