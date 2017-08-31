import React from "react"
import Select, {Option} from "rc-select"
import "rc-select/assets/index.css"
import { get, map, merge } from "lodash"
import Modal from "./Modal"

/*
<ChoiceModal choices=[{label: "label", value: "value", disabled: false}]
             defaultValue=""
             callback=(data) => {}

             // optional
             disabled={false}
             className=""
             buttonText=""
             titleText=""
/>
*/
var count = 1

export default class ChoiceModal extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            value: props.defaultValue,
            changed: false,
        }
    }
    componentWillReceiveProps(nextProps) {
        this.state = {
            value: nextProps.defaultValue,
        }
    }
    onValueChange(value) {
        this.setState({
            value: value,
            changed: (this.props.defaultValue != value)
        })
    }
    getResult() {
        return {
            value: this.state.value || false,
        }
    }
    performSubmit() {
        const payload = merge(this.getResult(), {changed: this.state.changed})
        this.props.callback(payload)
    }
    createOption(item) {
        return (
            <Option
                key={count++}
                value={item.value}
                text={item.label}
                disabled={get(item, "disabled", false)}
            >
                {item.label}
            </Option>
        )
    }
    createSelect() {
        return (
            <Select
                style={{ width: "100%" }}
                dropdownMenuStyle={{ maxHeight: 300, overflow: "auto" }}
                defaultActiveFirstOption={false}
                defaultValue={this.props.defaultValue}
                onChange={this.onValueChange.bind(this)}
                optionLabelProp="text"
                optionFilterProp="text"
            >
                {map(this.props.choices, this.createOption)}
            </Select>
        )
    }
    render() {
        return (
            <Modal
                className={this.props.className}
                buttonText={this.props.buttonText}
                titleText={this.props.titleText}
                tooltipText={this.props.tooltipText}
                tooltipDelay={this.props.tooltipDelay}
                disabled={this.props.disabled}
                getResult={this.getResult.bind(this)}
                performSubmit={this.performSubmit.bind(this)}
            >
                <div className="form-group">
                    <label>Value</label>
                    { this.createSelect() }
                </div>
            </Modal>
        )
    }
}
