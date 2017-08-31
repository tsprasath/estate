import React from "react"


class WithLoading extends React.Component {
    render () {
        let renderElement
        if (this.props.loading === "error") {
            if (this.props.reload){
                renderElement = (
                    <span>
                        <p>Failed to load data <button className="btn btn-default" onClick={this.props.reload}>Reload</button></p>
                    </span>
                )
            } else {
                renderElement = (
                    <p>Failed to load data</p>
                )
            }
        } else if (this.props.loading || typeof this.props.loading === "undefined"){
            renderElement = (<div className="label label-default col-xs-12"><h3><span className="glyphicon glyphicon-refresh spinning"/></h3></div>)
        } else {
            renderElement = this.props.children
        }
        return (
            <div>
                {renderElement}
            </div>
        )
    }
}
export default WithLoading
