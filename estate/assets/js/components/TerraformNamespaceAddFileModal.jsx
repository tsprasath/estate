import React from "react"
import { connect } from "react-redux"
import Select, {Option} from "rc-select"
import "rc-select/assets/index.css"
import { get, map, orderBy } from "lodash"
import urljoin from "url-join"
import Modal from "./Modal"
import * as api from "../api/terraform"

class TerraformNamespaceAddFileModal extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            templateID: false,
            templateName: false,
        }
    }
    componentWillMount() {
        this.props.getAllTemplates()
    }
    onTypeChange(value) {
        this.setState({
            templateID: value,
        })
    }
    onNameChange(value) {
        this.setState({
            templateName: value.target.value,
        })
    }
    getResult() {
        return {
            templateID: this.state.templateID || false,
            templateName: this.state.templateName || false,
        }
    }
    performSubmit() {
        if (this.state.templateID == "-1") {
            this.props.addFileToNamespace({
                namespace: this.props.namespace.slug,
                title: this.state.templateName,
            })
        } else {
            this.props.addTemplateToNamespace({
                namespace: this.props.namespace.slug,
                title: this.state.templateName,
                templateID: this.state.templateID,
                inputs: {},
                overrides: "",
            })
        }
    }
    render() {
        var count = 0
        return (
            <Modal
                className={this.props.className}
                buttonText={this.props.buttonText}
                titleText={this.props.titleText}
                tooltipText="Add file or template to namespace"
                disabled={this.props.disabled}
                getResult={this.getResult.bind(this)}
                performSubmit={this.performSubmit.bind(this)}
            >
                <div className="form-group">
                    <label>Type</label>
                    <Select
                        style={{ width: "100%" }}
                        dropdownMenuStyle={{ maxHeight: 300, overflow: "auto" }}
                        defaultActiveFirstOption={false}
                        defaultValue={this.props.defaultValue}
                        onChange={this.onTypeChange.bind(this)}
                        optionLabelProp="display"
                        optionFilterProp="text"
                    >
                        <Option
                            key={count++}
                            value="-1"
                            display="Regular File"
                            text="Regular File regular file"
                        >
                            <b>Regular File</b>
                        </Option>
                        {map(this.props.templates, (item) => {
                            return (<Option key={count++} value={item.pk.toString()} display={item.title + " - " + item.version} text={item.title + item.title.toLowerCase()} disabled={get(item, "disabled", false)}>{item.title} - {item.version}</Option>)
                        })}
                    </Select>
                </div>
                <div className="form-group">
                    <label>Filename</label>
                    <input
                        type="text"
                        className="form-control"
                        onChange={this.onNameChange.bind(this)}
                    />
                </div>
            </Modal>
        )
    }
}
let mapStateToProps = (state) => {
    return {
        templates: orderBy(state.terraform.templates, ["slug", "title"], ["asc", "asc"]),
    }
}

let mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getAllTemplates: () => {
            // TODO: is this pagesize hack ok?
            api.getTemplates(1, 10000000000, "")
        },
        addFileToNamespace: (payload) => {
            var req = api.addFileToNamespace(payload)
            req.then((res) => {
                ownProps.history.push( urljoin(ownProps.url, "/file/", res.data.slug, "/") )
            })
        },
        addTemplateToNamespace: (payload) => {
            var req = api.addTemplateToNamespace(payload)
            req.then((res) => {
                ownProps.history.push( urljoin(ownProps.url, "/template/", res.data.slug, "/") )
            })
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TerraformNamespaceAddFileModal)
