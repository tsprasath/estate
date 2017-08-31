import React from "react"
import { Link } from "react-router-dom"
import { each } from "lodash"
import urljoin from "url-join"
import ReactTable from "react-table"
import "react-table/react-table.css"
import Modal from "./Modal"

class CreateObjectModal extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            title: false,
        }
    }
    onTitleChange(value) {
        this.setState({ title: value.target.value})
    }
    getResult() {
        return {
            title: this.state.title || false,
            dependencies: [],
            version_increment: "initial",
        }
    }
    performSubmit() {
        this.props.createObject(this.getResult())
    }
    render() {
        return(
            <Modal className="btn btn-default col-xs-12" buttonText="Create..." titleText={`Create New ${this.props.objectNiceName}`} getResult={this.getResult.bind(this)} performSubmit={this.performSubmit.bind(this)}>
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" className="form-control" onChange={this.onTitleChange.bind(this)} />
                </div>
            </Modal>
        )
    }
}

/**
 * A generic list component, used to generate the Nomad/Terraform template and
 * namespace list views.
 *
 * objectNiceName: a human-readable name for the object this is a list of
 * tableColumns: an array of react-table columns
 * dataLoading:
 * data: the actual data to be displayed, e.g. an array of templates
 * page: the current page
 * pages: an array of pages
 * getData: a function to populate the data
 * createObject: a function to call on object creation
 */
class DashboardListView extends React.Component {
    constructor(props, context) {
        super(props, context)
        this.state = {
            pageSize: 10,
        }
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.search != this.props.search){
            this.props.getData(1, this.state.pageSize, nextProps.search)
        }
    }
    componentWillMount() {
        if (!this.props.dataLoading) {
            this.props.getData(1, this.state.pageSize, this.props.search)
        }
    }
    onPageChange(pageIndex) {
        // ReactTable used a 0 based page index while DRF does not
        this.props.getData(pageIndex + 1, this.state.pageSize, this.props.search)
    }
    onPageSizeChange(pageSize, pageIndex) {
        // ReactTable used a 0 based page index while DRF does not
        this.props.getData(pageIndex + 1, pageSize, this.props.search)
        this.setState({pageSize: pageSize})
    }
    data() {
        let data = []
        each(this.props.data, (item) => {
            if (item) {
                item.link = <Link className="btn btn-default btn-xs glyphicon glyphicon-pencil" to={ urljoin(this.props.match.url, item.slug) } />
                item.modified = new Date(Date.parse(item.modified)).toLocaleString()
                data.push(item)
            }
        })
        return data
    }
    render () {
        return (
            <div>
                <div className="col-xs-2 sidebar">
                    <ul className="nav nav-sidebar">
                        <li><CreateObjectModal createObject={this.props.createObject} objectNiceName={this.props.objectNiceName}/></li>
                    </ul>
                </div>
                <div className="col-xs-10 col-xs-offset-2 main">
                    <ReactTable
                        manual
                        data={this.data()}
                        // ReactTable used a 0 based page index
                        page={this.props.dataPage - 1}
                        pages={this.props.dataPages}
                        pageSize={this.state.pageSize}
                        columns={this.props.tableColumns}
                        className={"-striped -highlight"}
                        onPageChange={this.onPageChange.bind(this)}
                        onPageSizeChange={this.onPageSizeChange.bind(this)}
                    />
                </div>
            </div>
        )
    }
}

export default DashboardListView
