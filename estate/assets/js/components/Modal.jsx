import React from "react"
import RModal from "react-modal"
import ReactTooltip from "react-tooltip"
import { includes, values } from "lodash"

let count = 1

const customStyles = {
    content : {
        position: "fixed",
        left: "5%",
        top: "5%",
        width: "90%",
        height: "90%",
        outline: "none",
        overflow: "auto", /* Enable scroll if needed */
    },
    overlay: {zIndex: 99}
}

class Modal extends React.Component {
    constructor (props, context) {
        super(props, context)
        this.state = { }
    }
    isSaveValid() {
        let result = this.props.getResult()
        return (!includes(values(result), false))
    }
    submit() {
        if (this.isSaveValid()){
            this.props.performSubmit()
        }
        this.closeModal()
    }
    openModal() {
        if (!this.props.disabled)
            this.setState({modalIsOpen: true})
    }
    closeModal() {
        this.setState({modalIsOpen: false})
    }
    render() {
        let classNames = this.props.className || "btn btn-default"
        let buttonText = this.props.buttonText || "Open Modal"
        let titleText = this.props.titleText || "Modal"
        let tooltipId = `modal_button_tooltip_${count++}`
        let tooltipDelay = typeof(this.props.tooltipDelay) === "undefined" ? 0 : this.props.tooltipDelay
        let tooltipText = this.props.tooltipText || null
        return (
            <div style={{display: "inline"}}>
                <div data-for={tooltipId} data-tip={tooltipText} style={{cursor: "pointer"}} className={classNames} onClick={this.openModal.bind(this)} disabled={this.props.disabled}>
                    {buttonText}
                </div>
                <ReactTooltip id={tooltipId} className="ReactTooltipHoverDelay" delayHide={tooltipDelay} effect='solid'/>
                <RModal
                    className="Modal__Bootstrap modal-dialog"
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal.bind(this)}
                    style={customStyles}
                    contentLabel={titleText}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" onClick={this.closeModal.bind(this)}>
                                <span aria-hidden="true">&times;</span>
                                <span className="sr-only">Close</span>
                            </button>
                            <h2 className="modal-title">{titleText}</h2>
                        </div>
                        <form className="modal-form" onSubmit={this.submit.bind(this)}>
                            <div className="modal-body" style={{overflow: "auto"}}>
                                { this.props.children }
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-default" type="button" onClick={this.closeModal.bind(this)} >Close</button>
                                <button className={"btn btn-primary"} disabled={!this.isSaveValid()} type="submit" >Submit</button>
                            </div>
                        </form>
                    </div>
                </RModal>
            </div>
        )
    }
}

export default Modal
