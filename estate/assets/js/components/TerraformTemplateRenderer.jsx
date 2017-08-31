import React from "react"
import { connect } from "react-redux"
import { isEqual, isEmpty, merge } from "lodash"
import JsonSchemaForm from "react-jsonschema-form"
import { getDefaultFormState } from "react-jsonschema-form/lib/utils"
import Editor from "./Editor"
import * as api from "../api/terraform"

class TerraformTemplateRenderer extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.rerenderTemplate = null
        this.state = {
            json_schema: "{}",
            ui_schema: "{}",
            body: "",
            inputs: {},
            overrides: "",
            disable: false,
        }
    }
    componentWillMount() {
        if (this.props.template) {
            this.loadTemplateIntoState(this.props.template)
            this.renderTemplate()
        }
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.template && !isEqual(this.props.template, nextProps.template)){
            this.loadTemplateIntoState(nextProps.template)
        }
    }
    componentDidUpdate() {
        if (this.rerenderTemplate){
            this.renderTemplate()
            this.rerenderTemplate = null
        }
    }
    loadTemplateIntoState(template) {
        var payload = {}
        if (!isEqual(this.state.json_schema, template.json_schema))
            payload.json_schema = template.json_schema

        if (!isEqual(this.state.ui_schema, template.ui_schema))
            payload.ui_schema = template.ui_schema

        if (!isEqual(this.state.body, template.body))
            payload.body = template.body

        if (!isEqual(this.state.inputs, template.inputs))
            payload.inputs = template.inputs

        if (!isEqual(this.state.overrides, template.overrides))
            payload.overrides = template.overrides

        if (!isEqual(this.state.disable, template.disable))
            payload.disable = template.disable

        if (!isEmpty(payload)) {
            this.rerenderTemplate = true
            this.setState(payload)
        }
    }
    isValidJsonSchema() {
        try {
            JSON.parse(this.state.json_schema)
        }
        catch(e){
            return false
        }
        return true
    }
    isValidUISchema() {
        try {
            JSON.parse(this.state.ui_schema)
        }
        catch(e){
            return false
        }
        return true
    }
    isValidBody() {
        // TODO: Use the API to check if the body is good or now
        //try {
        //    var yaml = jsyaml.safeLoad(this.state.body)
        //}
        //catch(e){
        //    return false
        //}
        //if (typeof(yaml) == 'string') {
        //    return false
        //}
        return true
    }
    isValidOverrides() {
        try {
            var yaml = window.jsyaml.safeLoad(this.state.overrides)
        }
        catch(e){
            return false
        }
        if (typeof(yaml) == "string") {
            return false
        }
        return true
    }
    isValid() {
        return (this.isValidJsonSchema() && this.isValidUISchema() && this.isValidBody())
    }
    canSave() {
        return (this.hasChanged() == true && this.isValid())
    }
    onInputsChange(data) {
        this.state.inputs = data.formData
        if (this.props.onInputsChange) {
            this.props.onInputsChange(data)
        }
        this.rerenderTemplate = true
        this.setState({
            inputs: data.formData,
        })
    }
    onOverridesChange(data) {
        this.state.overrides = data.currentContent
        if (this.props.onOverridesChange) {
            this.props.onOverridesChange(data)
        }
        this.rerenderTemplate = true
        this.setState({
            overrides: data.currentContent,
        })
    }
    renderTemplate() {
        if (!this.isValid()){
            return null
        }
        if (!this.isValidOverrides()) {
            return null
        }
        let formDefaults = getDefaultFormState(JSON.parse(this.state.json_schema))
        const payload = {
            body: this.state.body,
            inputs: JSON.stringify(merge(formDefaults, this.state.inputs)),
            overrides: this.state.overrides,
            disable: this.state.disable,
        }
        this.props.renderTemplate(payload)
    }
    createErrorBars() {
        var count = 0
        var elements = []
        if (this.isValidJsonSchema() == false){
            elements.push(<button key={count++} disabled={true} className="btn btn-danger col-xs-12">Invalid JSON Schema</button>)
        }
        if (this.isValidUISchema() == false){
            elements.push(<button key={count++} disabled={true} className="btn btn-danger col-xs-12">Invalid UI Schema</button>)
        }
        if (this.isValidBody() == false){
            elements.push(<button key={count++} disabled={true} className="btn btn-danger col-xs-12">Invalid Template Body</button>)
        }
        return elements
    }
    createForm() {
        if (!this.isValid()) {
            return null
        }
        return (
            <div>
                <div className="col-xs-12 col-md-6" style={{ marginBottom: "10px"}}>
                    <JsonSchemaForm schema={JSON.parse(this.state.json_schema)} uiSchema={JSON.parse(this.state.ui_schema)} formData={this.state.inputs} onChange={this.onInputsChange.bind(this) } liveValidate={true}>
                        <span/>
                    </JsonSchemaForm>
                    <Editor title="Overrides" options={{ mode: "yaml" }} content={ this.state.overrides } onUpdateContent={this.onOverridesChange.bind(this)} />
                </div>
                <div className="col-xs-12 col-md-6">
                    <Editor title="Rendered Output" options={{ readOnly: true }} content={ JSON.stringify(this.props.renderedTemplate, null, 2) } />
                </div>
            </div>
        )
    }
    render() {
        return (
            <div className="col-xs-12">
                {this.createErrorBars()}
                {this.createForm()}
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        renderTemplate: api.renderTemplate,
        renderedTemplate: state.terraform.renderedTemplate,
    }
}
export default connect(mapStateToProps)(TerraformTemplateRenderer)
