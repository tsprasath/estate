import React from "react"
import Modal from "./Modal"

export default class ConfirmModal extends React.Component {
    getResult() {
        return {}
    }
    render() {
        return(
            <Modal
                className={this.props.className}
                buttonText={this.props.buttonText}
                titleText={this.props.titleText}
                tooltipText={this.props.tooltipText}
                tooltipDelay={this.props.tooltipDelay}
                disabled={this.props.disabled}
                getResult={this.getResult.bind(this)}
                performSubmit={this.props.callback}
            >
                <p>{this.props.message || "Are you sure?"}</p>
            </Modal>
        )
    }
}
