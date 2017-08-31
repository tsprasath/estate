import React from "react"
import { connect } from "react-redux"
import { Route, NavLink } from "react-router-dom"
import { RadioGroup, Radio } from "react-radio-group"
import { includes, find, merge, isEqual } from "lodash"
import urljoin from "url-join"
import WithLoading from "./WithLoading"
import Editor from "./Editor"
import ChoiceModal from "./ChoiceModal"
import ConfirmModal from "./ConfirmModal"
import TerraformTemplateRenderer from "./TerraformTemplateRenderer"
import * as api from "../api/terraform"

const VersionChoices = [
    {label: "Major", value: "major", disabled: false},
    {label: "Minor", value: "minor", disabled: false},
    {label: "Patch", value: "patch", disabled: false},
]

class TerraformTemplateItem extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            previewing: false,
            templateMode: "hcl",
            description: "",
            description_changed: false,
            json_schema: "{}",
            json_schema_changed: false,
            ui_schema: "{}",
            ui_schema_changed: false,
            body: "",
            body_changed: false,
            inputs: {},
            overrides: "",
            dependencies: [],
            dependencies_changed: false,
        }
    }
    componentWillMount() {
        this.props.getTemplate()
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.template && !isEqual(this.props.template, nextProps.template)){
            const template = nextProps.template
            this.setState({
                description: template.description,
                json_schema: template.json_schema || "{}",
                ui_schema: template.ui_schema || "{}",
                body: template.body,
                templateMode: template.body_mode,
                dependencies: template.dependencies,
            })
        }
    }
    onDescriptionChange(data) {
        this.setState({
            description: data.currentContent,
            description_changed: data.changed,
        })
    }
    onJsonSchemaChange(data) {
        this.setState({
            json_schema: data.currentContent,
            json_schema_changed: data.changed,
        })
    }
    onUISchemaChange(data) {
        this.setState({
            ui_schema: data.currentContent,
            ui_schema_changed: data.changed,
        })
    }
    onBodyChange(data) {
        this.setState({
            body: data.currentContent,
            body_changed: data.changed,
        })
    }
    onInputsChange(data) {
        this.setState({
            inputs: data.formData,
        })
    }
    onOverridesChange(data) {
        this.setState({
            overrides: data.currentContent,
        })
    }
    onDependenciesChange() {
        this.setState({
            dependencies_changed: [],
        })
    }
    onTemplateModeChange(value) {
        this.setState({
            templateMode: value
        })
    }
    hasChanged() {
        const changes = [
            this.state.description_changed,
            this.state.json_schema_changed,
            this.state.ui_schema_changed,
            this.state.body_changed,
            this.state.dependencies_changed,
        ]
        return (includes(changes, true))
    }
    getResult() {
        return {
            title: this.state.title,
            description: this.state.description,
            json_schema: this.state.json_schema,
            ui_schema: this.state.ui_schema,
            body: this.state.body,
            dependencies: this.state.dependencies,
        }
    }
    updateTemplate(data) {
        const payload = merge(this.getResult(), {version_increment: data.value})
        this.props.updateTemplate(this.props.template.pk, payload)
        this.setState({
            description_changed: false,
            json_schema_changed: false,
            ui_schema_changed: false,
            body_changed: false,
            dependencies_changed: false,
        })
    }
    createPreview() {
        const template = {
            json_schema: this.state.json_schema,
            ui_schema: this.state.ui_schema,
            body: this.state.body,
            inputs: this.state.inputs,
            overrides: this.state.overrides,
            disable: false,
        }
        return (
            <div>
                <h1 className="page-header">Preview</h1>
                <TerraformTemplateRenderer template={template} onInputsChange={this.onInputsChange.bind(this)} onOverridesChange={this.onOverridesChange.bind(this)}/>
            </div>
        )
    }
    createJsonSchemaHeader() {
        return (
            <span>
                JSON Schema
                <small className="form-text text-muted"> (Uses <a href="https://mozilla-services.github.io/react-jsonschema-form/">JsonSchemaForm</a> DSL)</small>
            </span>
        )
    }
    createTemplateBodyHeader() {
        return (
            <span>
                Template Body
                <small className="form-text text-muted"> (Uses <a href="http://jinja.pocoo.org/">Jinja</a> Templating)</small>
                <span className="pull-right">
                    <RadioGroup name="templateMode" selectedValue={this.state.templateMode} onChange={this.onTemplateModeChange.bind(this)}>
                        MODE: &nbsp;
                        <Radio value="hcl" /> HCL&nbsp;
                        <Radio value="yaml" /> YAML&nbsp;
                    </RadioGroup>
                </span>
            </span>
        )
    }
    createEditor() {
        const template = this.props.template
        const loading = this.props.templatesLoading
        let options = {}
        if (this.state.templateMode === "yaml"){
            options = { mode: {name: "yaml", statementIndent: 2}, lint: false }
        }
        if (this.state.templateMode === "hcl"){
            options = { mode: {name: "go", statementIndent: 4}, lint: false }
        }
        return (
            <WithLoading loading={loading} reload={this.props.getTemplate}>
                <h1 className="page-header">Edit <span className="pull-right">{template.version}</span></h1>
                <div className="row">
                    <div className="col-xs-12">
                        <Editor title="Description" options={{ mode: "markdown" }} content={this.state.description} onUpdateContent={this.onDescriptionChange.bind(this)} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-6">
                        <Editor title={this.createJsonSchemaHeader()} content={this.state.json_schema} onUpdateContent={this.onJsonSchemaChange.bind(this)} />
                    </div>
                    <div className="col-xs-6">
                        <Editor title="UI Schema" content={this.state.ui_schema} onUpdateContent={this.onUISchemaChange.bind(this)} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <Editor title={this.createTemplateBodyHeader()} options={options} content={this.state.body} onUpdateContent={this.onBodyChange.bind(this)} />
                    </div>
                </div>
            </WithLoading>
        )
    }
    render() {
        if (this.props.template == null) {
            return null
        }
        const url = this.props.match.url
        const template = this.props.template
        return (
            <div>
                <div className="col-xs-2 sidebar">
                    <ul className="nav nav-sidebar">
                        <li className="text-center">
                            <span style={{ fontSize: "20px", color: "red"}}>{this.hasChanged() ? "(Needs Save)": ""}</span>
                        </li>
                        <div className="nav-sidebar-header">
                            <h4>{template.title}</h4>
                        </div>
                        <li>
                            <ConfirmModal
                                className="btn btn-danger col-xs-12"
                                buttonText="Delete"
                                titleText="Delete Template"
                                callback={this.props.deleteTemplate.bind(this)}
                            />
                        </li>
                        <li>
                            <ChoiceModal
                                choices={VersionChoices}
                                defaultValue="patch"
                                callback={this.updateTemplate.bind(this)}
                                disabled={this.hasChanged() == false}
                                buttonText="Save"
                                titleText="Save"
                                className="btn btn-default col-xs-12"
                            />
                        </li>
                    </ul>
                    <ul className="nav nav-sidebar">
                        <div className="nav-sidebar-header"></div>
                        <li>
                            <NavLink className="col-xs-12" to={`${url}`} exact activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}}>Edit</NavLink>
                        </li>
                        <li>
                            <NavLink className="col-xs-12" to={ urljoin(url, "/preview") } activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}}>Preview</NavLink>
                        </li>
                    </ul>
                </div>
                <div className="col-xs-10 col-xs-offset-2 main">
                    <Route exact path={`${url}/`} render={this.createEditor.bind(this)}/>
                    <Route path={`${url}/preview`} render={this.createPreview.bind(this)}/>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const template = find(state.terraform.templates, {"slug": ownProps.match.params.template})
    return {
        templatesLoading: state.terraform.loading.templates,
        template: template,
        renderedTemplate: state.terraform.renderedTemplate,
        getTemplate: () => {
            api.getTemplate(ownProps.match.params.template)
        },
        updateTemplate: api.updateTemplate,
        deleteTemplate: () => {
            var req = api.deleteTemplate(template.pk)
            req.then(() => {
                ownProps.history.push("/terraform/templates")
            })
        },
        renderTemplate: api.renderTemplate,
    }
}
export default connect(mapStateToProps)(TerraformTemplateItem)
