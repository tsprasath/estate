import React from "react"
import { assign, cloneDeep } from "lodash"
import CodeMirror from "react-codemirror"
import "codemirror/lib/codemirror.css"
import "codemirror/mode/yaml/yaml.js"
import "codemirror/mode/javascript/javascript.js"
import "codemirror/mode/markdown/markdown.js"
import "codemirror/mode/jinja2/jinja2.js"
import "codemirror/mode/go/go.js"
import "codemirror/mode/shell/shell.js"
import "codemirror/keymap/sublime.js"
import "codemirror/addon/fold/foldcode.js"
import "codemirror/addon/fold/foldgutter.js"
import "codemirror/addon/fold/foldgutter.css"
import "codemirror/addon/fold/indent-fold.js"
import "codemirror/addon/fold/comment-fold.js"
import "codemirror/addon/fold/brace-fold.js"
import "codemirror/addon/lint/lint.js"
import "codemirror/addon/lint/lint.css"
import "codemirror/addon/lint/javascript-lint.js"
import "codemirror/addon/lint/json-lint.js"
import "codemirror/addon/lint/yaml-lint.js"


const DefaultCodeMirrorOptions = {
    lineWrapping: true,
    lineNumbers: true,
    matchBrackets: true,
    foldGutter: true,
    keyMap: "sublime",
    mode: {
        name: "javascript",
        json: true,
        statementIndent: 2,
    },
    indentWithTabs: false,
    tabSize: 2,
    gutters: ["CodeMirror-foldgutter", "CodeMirror-linenumbers", "CodeMirror-lint-markers"],
    lint: true,
}

// Sometimes data coming in has newline chars that textarea's don't respect
// thusly it converts them - so we effectively do the conversion first
// so that we can compare properly if the content has changed
var re=/\r\n|\n\r|\n|\r/g

var count = 0

export default class Editor extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = this.prepareContent.bind(this)(props)
        this.state.changed = false
    }
    componentWillReceiveProps(nextProps) {
        this.setState(this.prepareContent.bind(this)(nextProps))
    }
    prepareContent(props) {
        const currentContent = props.content.replace(re,"\n")
        var initialContent = cloneDeep(currentContent)
        if (props.initialContent)
            initialContent = props.initialContent.replace(re,"\n")
        return {
            initialContent: initialContent,
            currentContent: currentContent,
        }
    }
    updateContent(value) {
        const changed = (this.state.initialContent != value)
        const data = {
            currentContent: value,
            changed: changed
        }
        this.setState(data)
        if (this.props.onUpdateContent) {
            this.props.onUpdateContent(data)
        }
    }
    render() {
        var id = `collapse_${count++}`
        var options = assign({}, DefaultCodeMirrorOptions, this.props.options || {})
        return (
            <div className="panel-group">
                <div className="panel panel-default">
                    <div className="panel-heading" style={{ minHeight: "40px" }}>
                        <h3 className="panel-title">
                            <div id="accordion" className="pull-right" data-toggle="collapse" data-target={"#" + id} style={{marginLeft: "20px"}}/>
                            {this.props.title || "    "}
                        </h3>
                    </div>
                    <div id={id} className="panel-collapse collapse in">
                        <div className="panel-body" style={{ padding: "0px" }}>
                            <div style={{border: "solid", borderWidth: "1px", clear: "left"}}>
                                <CodeMirror ref="editor" defaultValue={this.state.currentContent} value={this.state.currentContent} onChange={this.updateContent.bind(this)} options={options} autoFocus={this.props.autoFocus} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
