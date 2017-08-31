import React from "react"
import { connect } from "react-redux"
import { Route, NavLink } from "react-router-dom"
import { includes, find, findIndex, each, cloneDeep, isEqual, join } from "lodash"
import urljoin from "url-join"
import ReactTooltip from "react-tooltip"
import Ansi from "ansi-to-react"
import Editor from "./Editor"
import ConfirmModal from "./ConfirmModal"
import TerraformNamespaceAddFileModal from "./TerraformNamespaceAddFileModal"
import TerraformTemplateRenderer from "./TerraformTemplateRenderer"
import * as terraform from "../api/terraform"
import * as messages from "../api/messages"



class TerraformNamespaceItem extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.isSaving = false
        this.fileToRemove = null
        this.templateToRemove = null
        this.state = {
            files: [],
            templates: [],
        }
    }
    componentWillMount() {
        this.props.getNamespace()
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.namespace && !this.isSaving && !isEqual(this.props.namespace, nextProps.namespace)){
            const namespace = nextProps.namespace
            nextProps.getPlan(namespace.pk)
            nextProps.getApply(namespace.pk)
            this.mergeFiles(namespace)
            this.mergeTemplates(namespace)
        }
    }
    hasChanged() {
        var changes = []
        each(this.state.files, (item) => {
            changes.push(item.changed)
        })
        each(this.state.templates, (item) => {
            changes.push(item.changed)
        })
        return (includes(changes, true))
    }
    mergeFiles(namespace) {
        each(namespace.files, (item) => {
            item.nextContent = item.content
            item.nextDisable = item.disable
            item.changed = false
        })
        each(this.state.files, (item) => {
            var index = findIndex(namespace.files, {"pk": item.pk})
            if (index != -1){
                let file = namespace.files[index]
                file.nextContent = item.nextContent
                file.nextDisable = item.nextDisable
                file.changed = item.changed
            } else {
                namespace.files.push(item)
            }
        })
        if (this.fileToRemove) {
            var index = findIndex(namespace.files, {"pk": this.fileToRemove})
            if (index != -1){
                namespace.files.pop(index)
            }
            this.fileToRemove = null
        }
        this.setState({
            files: namespace.files,
        })
    }
    mergeTemplates(namespace) {
        each(namespace.templates, (item) => {
            item.nextInputs = item.inputs
            item.nextOverrides = item.overrides
            item.nextDisable = item.disable
            item.changed = false
        })
        each(this.state.templates, (item) => {
            var index = findIndex(namespace.templates, {"pk": item.pk})
            if (index != -1){
                let template = namespace.templates[index]
                template.nextInputs = item.nextInputs
                template.nextOverrides = item.nextOverrides
                template.nextDisable = item.nextDisable
                template.changed = item.changed
            } else {
                namespace.templates.push(item)
            }
        })
        if (this.templateToRemove) {
            var index = findIndex(namespace.templates, {"pk": this.templateToRemove})
            if (index != -1){
                namespace.templates.pop(index)
            }
            this.templateToRemove = null
        }
        this.setState({
            templates: namespace.templates,
        })
    }
    hasFileChanged(file) {
        return (!isEqual(file.content, file.nextContent) || !isEqual(file.disable, file.nextDisable))
    }
    onFileChange(index, data) {
        var files = cloneDeep(this.state.files)
        files[index].nextContent = data.currentContent
        files[index].changed = this.hasFileChanged(files[index])
        this.setState({
            files: files,
        })
    }
    onFileToggleDisable(index, value) {
        var files = cloneDeep(this.state.files)
        files[index].nextDisable = value
        files[index].changed = this.hasFileChanged(files[index])
        this.setState({
            files: files,
        })
    }
    hasTemplateInstanceChanged(templateInstance) {
        return (!isEqual(templateInstance.inputs, templateInstance.nextInputs) || !isEqual(templateInstance.overrides, templateInstance.nextOverrides) || !isEqual(templateInstance.disable, templateInstance.nextDisable))
    }
    onInputsChange(index, data) {
        var templates = cloneDeep(this.state.templates)
        templates[index].nextInputs = data.formData
        templates[index].changed = this.hasTemplateInstanceChanged(templates[index])
        this.setState({
            templates: templates,
        })
    }
    onOverridesChange(index, data) {
        var templates = cloneDeep(this.state.templates)
        templates[index].nextOverrides = data.currentContent
        templates[index].changed = this.hasTemplateInstanceChanged(templates[index])
        this.setState({
            templates: templates,
        })
    }
    onTemplateToggleDisable(index, value) {
        var templates = cloneDeep(this.state.templates)
        templates[index].nextDisable = value
        templates[index].changed = this.hasTemplateInstanceChanged(templates[index])
        this.setState({
            templates: templates,
        })
    }
    saveNamespace() {
        this.isSaving = true
        each(this.state.files, (item) => {
            if (item.changed) {
                item.content = item.nextContent
                item.disable = item.nextDisable
                item.changed = false
                this.props.updateFile(item.pk, item)
            }
        })
        each(this.state.templates, (item) => {
            if (item.changed){
                item.inputs = item.nextInputs
                item.overrides = item.nextOverrides
                item.disable = item.nextDisable
                item.changed = false
                this.props.updateTemplateInstance(item.pk, item)
            }
        })
        this.props.updateNamespace(
            this.props.namespace.pk,
            {
                title: this.props.namespace.title,
                description: "",
            }
        )
        this.isSaving = false
    }
    updateFile() {
        var file = this.props.namespace.files[this.props.fileIndex]
        this.props.updateFile(
            file.pk,
            {
                title: file.title,
                namespace: file.namespace,
                content: this.state.content,
            }
        )
    }
    removeFileFromNamespace(id) {
        this.fileToRemove = id
        this.props.removeFileFromNamespace(id)
    }
    removeTemplateFromNamespace(id) {
        this.templateToRemove = id
        this.props.removeTemplateFromNamespace(id)
    }
    planNamespace() {
        if (this.hasChanged()) {
            messages.warn("There are unsaved changes!  Please save or revert to perform a 'plan'.")
        } else {
            this.props.planNamespace(this.props.namespace.pk)
        }
    }
    applyNamespace() {
        if (this.hasChanged()) {
            messages.warn("There are unsaved changes!  Please save or revert to perform an 'apply'.")
        } else {
            if (typeof this.props.planOutput.plan_hash === "undefined") {
                messages.warn("There was no previous 'plan' found!  Please 'plan' before you perform an 'apply'.")
            } else {
                this.props.applyNamespace(this.props.namespace.pk, this.props.planOutput.plan_hash)
            }
        }
    }
    createFilePane(props) {
        var index = findIndex(this.state.files, {slug: props.match.params.file})
        if (index == -1){
            return null
        }
        var file = this.state.files[index]
        return (
            <div className="col-xs-12">
                <h1 className="page-header">
                    {file.title}
                    <div className="pull-right">
                        { file.nextDisable ?
                            <div className="btn btn-success btn-inline" onClick={this.onFileToggleDisable.bind(this, index, false)}>Enable</div>
                            :
                            <div className="btn btn-danger btn-inline" onClick={this.onFileToggleDisable.bind(this, index, true)}>Disable</div>
                        }
                    </div>
                </h1>
                <Editor className="editor editor-lg" options={{ mode: "go"}} content={file.nextContent} initialContent={file.content} onUpdateContent={this.onFileChange.bind(this, index)} />
            </div>
        )
    }
    createFileList() {
        var url = this.props.match.url
        var count = 0
        var elements = []
        if (this.state.files.length > 0){
            elements.push((
                <div key={`file${count++}`} className="nav-sidebar-header">
                    <span>Files</span>
                </div>
            ))
        }
        each(this.state.files, (item) =>{
            elements.push((
                <li key={`file${count++}`}>
                    <NavLink className="col-xs-9" to={ urljoin(url, "/file/", item.slug) } activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}}>
                        {item.title}
                    </NavLink>
                    <div className="pull-right">
                        <div data-for={`file_changed_${count}`} data-place="left" data-tip="Changed" className={"glyphicon" + (item.changed ? " glyphicon-exclamation-sign" : "")} />
                        <ReactTooltip id={`file_changed_${count}`} className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                        <div data-for={`file_disable_${count}`} data-place="left" data-tip="Disabled" className={"glyphicon" + (item.disable ? " glyphicon-ban-circle" : "")} />
                        <ReactTooltip id={`file_disable_${count}`} className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                        <ConfirmModal
                            className="glyphicon glyphicon-remove text-danger"
                            buttonText=" "
                            titleText="Delete File?"
                            tooltipText="Delete File"
                            tooltipDelay={10}
                            callback={this.removeFileFromNamespace.bind(this, item.pk)}
                        />
                    </div>
                </li>
            ))
        })
        return elements
    }
    createTemplateUpdateButton(id) {
        return (
            <ConfirmModal className="flashing text-danger glyphicon glyphicon-exclamation-sign"
                buttonText=" "
                titleText="Update to latest template version?"
                tooltipText="Click to update to latest version"
                callback={this.props.updateTemplateOfTemplateInstance.bind(null, id)} />
        )
    }
    createTemplatePane(props) {
        var index = findIndex(this.state.templates, {slug: props.match.params.template})
        if (index == -1){
            return null
        }
        var templateInstance = this.state.templates[index]
        const template = {
            json_schema: templateInstance.template.json_schema,
            ui_schema: templateInstance.template.ui_schema,
            body: templateInstance.template.body,
            inputs: templateInstance.nextInputs,
            overrides: templateInstance.nextOverrides,
            disable: templateInstance.nextDisable,
        }
        return (
            <div>
                <div className="col-xs-12">
                    <h1 className="page-header">
                        {templateInstance.title}
                        <div className="pull-right">
                            { templateInstance.nextDisable ?
                                <div className="btn btn-success btn-inline" onClick={this.onTemplateToggleDisable.bind(this, index, false)}>Enable</div>
                                :
                                <div className="btn btn-danger btn-inline" onClick={this.onTemplateToggleDisable.bind(this, index, true)}>Disable</div>
                            }
                            {/*<div className="btn btn-default btn-inline">Update</div>*/}
                            <span> [ {templateInstance.template.title} : {templateInstance.template.version} { templateInstance.is_outdated ? this.createTemplateUpdateButton.bind(this)(templateInstance.pk) : "" } ]</span>
                        </div>
                    </h1>
                </div>
                <div className="col-xs-12">
                    <div className="well">
                        { templateInstance.template.description }
                    </div>
                </div>
                <TerraformTemplateRenderer template={template} onInputsChange={this.onInputsChange.bind(this, index)} onOverridesChange={this.onOverridesChange.bind(this, index)}/>
            </div>
        )
    }
    createTemplateList() {
        var url = this.props.match.url
        var count = 0
        var elements = []
        if (this.state.templates.length > 0){
            elements.push((
                <div key={`template${count++}`} className="nav-sidebar-header">
                    <span>Templates</span>
                </div>
            ))
        }
        each(this.state.templates, (item) =>{
            elements.push((
                <li key={`template${count++}`}>
                    <NavLink className="col-xs-9" to={ urljoin(url, "/template/", item.slug) } activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}}>
                        {item.title}
                    </NavLink>
                    <div className="pull-right">
                        <div data-for={`template_changed_${count}`} data-place="left" data-tip="Changed" className={"glyphicon" + (item.changed ? " glyphicon-exclamation-sign" : "")} />
                        <ReactTooltip id={`template_changed_${count}`} className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                        <div data-for={`template_changed_${count}`} data-place="left" data-tip="Disabled" className={"glyphicon" + (item.disable ? " glyphicon-ban-circle" : "")} />
                        <ReactTooltip id={`template_disabled_${count}`} className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                        <ConfirmModal
                            className="glyphicon glyphicon-remove text-danger"
                            buttonText=" "
                            titleText="Delete Template?"
                            tooltipText="Delete Template"
                            tooltipDelay={10}
                            callback={this.removeTemplateFromNamespace.bind(this, item.pk)}
                        />
                    </div>
                </li>
            ))
        })
        return elements
    }
    createPlanPane() {
        var data = this.props.planOutput
        var exit_code = data.exit_code
        var output = join(data.output, "")
        var getBackgroundColor = () => {
            if (exit_code == 1 && !data.running) {
                return "bg-danger"
            } else if (exit_code == 2 && !data.running) {
                return "bg-info"
            } else if (exit_code == 0 && !data.running) {
                return "bg-success"
            } else {
                return "bg-default"
            }
        }
        return (
            <pre className={"col-xs-12 " + getBackgroundColor()}>
                <Ansi>
                    {output}
                </Ansi>
                { !data.running || typeof data.output === "undefined" ? null : <div style={{padding: " 0 5px"}} className="glyphicon glyphicon-refresh spinning" /> }
            </pre>
        )
    }
    createApplyPane() {
        var data = this.props.applyOutput
        var exit_code = data.exit_code
        var output = join(data.output, "")
        var getBackgroundColor = () => {
            if (exit_code != 0 && !data.running) {
                return "bg-danger"
            } else if (exit_code == 0 && !data.running) {
                return "bg-success"
            } else {
                return "bg-default"
            }
        }
        return (
            <pre className={"col-xs-12 " + getBackgroundColor()}>
                <Ansi>
                    {output}
                </Ansi>
                { !data.running ? null : <div style={{padding: " 0 5px"}} className="glyphicon glyphicon-refresh spinning" /> }
            </pre>
        )
    }
    render() {
        if (this.props.namespace == null) {
            return null
        }
        const url = this.props.match.url
        const namespace = this.props.namespace
        return (
            <div>
                <div className="col-xs-2 sidebar">
                    <ul className="nav nav-sidebar">
                        <li className="text-center">
                            <span style={{ fontSize: "20px", color: "red"}}>{this.hasChanged() ? "(Needs Save)": ""}</span>
                        </li>
                        <div className="nav-sidebar-header">
                            <h4>{namespace.title}</h4>
                        </div>
                        <li>
                            <ConfirmModal className="btn btn-danger col-xs-12"
                                buttonText="Delete"
                                titleText="Delete Namespace"
                                callback={this.props.deleteNamespace} />
                        </li>
                        <li>
                            <ConfirmModal className="btn btn-default col-xs-12"
                                buttonText="Save"
                                titleText="Save"
                                callback={this.saveNamespace.bind(this)}
                                disabled={this.hasChanged() == false} />
                        </li>
                    </ul>
                    <ul className="nav nav-sidebar">
                        <li>
                            <NavLink className="col-xs-11" to={ urljoin(url, "/plan") } exact  activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}} onClick={this.props.getPlan.bind(this, namespace.pk)}>Last Plan</NavLink>
                            <div data-for="terraform_plan" data-place="left" data-tip="terraform plan ..." style={{cursor: "pointer"}} className="pull-right glyphicon glyphicon-play-circle text-primary" onClick={this.planNamespace.bind(this)}></div>
                            <div>
                                <ReactTooltip id="terraform_plan" className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                            </div>
                        </li>
                        <li>
                            <NavLink className="col-xs-11" to={ urljoin(url, "/apply") } exact activeStyle={{fontWeight: "bold", color: "white", backgroundColor: "#337ab7"}} onClick={this.props.getApply.bind(this, namespace.pk)}>Last Apply</NavLink>
                            <div data-for="terraform_apply" data-place="left" data-tip="terraform apply ..." style={{cursor: "pointer"}} className="pull-right glyphicon glyphicon-play-circle text-primary" onClick={this.applyNamespace.bind(this)}></div>
                            <div>
                                <ReactTooltip id="terraform_apply" className="ReactTooltipHoverDelay" delayHide={10} effect='solid'/>
                            </div>
                        </li>
                    </ul>
                    <ul className="nav nav-sidebar">
                        <li>
                            <div className="nav-sidebar-header">
                            </div>
                        </li>
                        <li>
                            <TerraformNamespaceAddFileModal className="btn btn-default col-xs-12"
                                buttonText="+"
                                titleText="Add File or Template"
                                url={url}
                                history={this.props.history}
                                namespace={namespace} />
                        </li>
                    </ul>
                    <ul className="nav nav-sidebar">
                        { this.createFileList.bind(this)() }
                    </ul>
                    <ul className="nav nav-sidebar">
                        { this.createTemplateList.bind(this)()}
                    </ul>
                    <ul className="nav nav-sidebar">
                        <li>
                            <div style={{height: "50px"}}></div>
                        </li>
                    </ul>
                </div>
                <div className="col-xs-10 col-xs-offset-2 main">
                    <div className="row">
                        <Route path={`${url}/plan`} render={this.createPlanPane.bind(this)} />
                        <Route path={`${url}/apply`} render={this.createApplyPane.bind(this)} />
                        <Route path={`${url}/file/:file`} render={this.createFilePane.bind(this)} />
                        <Route path={`${url}/template/:template`} render={this.createTemplatePane.bind(this)} />
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const namespace = find(state.terraform.namespaces, {"slug": ownProps.match.params.namespace})
    return {
        namespacesLoading: state.terraform.loading.namespaces,
        namespace: namespace,
        getNamespace: () => {
            terraform.getNamespace(ownProps.match.params.namespace)
        },
        updateNamespace: terraform.updateNamespace,
        deleteNamespace: () => {
            var req = terraform.deleteNamespace(namespace.pk)
            req.then(() => {
                ownProps.history.push("/terraform/namespaces")
            })
        },
        updateFile: terraform.updateFile,
        updateTemplateInstance: terraform.updateTemplateInstance,
        updateTemplateOfTemplateInstance: terraform.updateTemplateOfTemplateInstance,
        planOutput: state.terraform.planOutput,
        applyOutput: state.terraform.applyOutput,
        getPlan: terraform.getPlanForNamespace,
        getApply: terraform.getApplyForNamespace,
    }
}
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        planNamespace: (id) => {
            terraform.doPlanForNamespace(id)
            ownProps.history.push( urljoin(ownProps.match.url, "/plan") )
        },
        applyNamespace: (id, plan_hash) => {
            terraform.doApplyForNamespace(id, plan_hash)
            ownProps.history.push( urljoin(ownProps.match.url, "/apply") )
        },
        removeFileFromNamespace: (id) => {
            var req = terraform.removeFileFromNamespace(ownProps.match.params.namespace, id)
            req.then(() => {
                // TODO: this doesn't work right - it should only redirect if you were viwing the file you deleted
                ownProps.history.push(`${ownProps.match.url}`)
            })
        },
        removeTemplateFromNamespace: (id) => {
            var req = terraform.removeTemplateFromNamespace(ownProps.match.params.namespace, id)
            req.then(() => {
                // TODO: this doesn't work right - it should only redirect if you were viwing the file you deleted
                ownProps.history.push(`${ownProps.match.url}`)
            })
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TerraformNamespaceItem)
