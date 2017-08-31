import { connect } from "react-redux"
import DashboardListView from "./DashboardListView"
import * as api from "../api/terraform"

const TerraformTemplatesTableColumns = [
    {
        Header: "",
        accessor: "link",
        maxWidth: 35,
        sortable: false,
        resizable: false,
    },
    {
        Header: "Template",
        accessor: "title",
        sort: "asc",
        sortable: false,
        maxWidth: 250,
    },
    {
        Header: "Description",
        accessor: "description",
        sortable: false,
    },
    {
        Header: "Version",
        accessor: "version",
        maxWidth: 80,
        sortable: false,
        resizable: true,
    },
    {
        Header: "Modified",
        accessor: "modified",
        maxWidth: 200,
        sortable: false,
        resizable: false,
    }
]

let mapStateToProps = (state) => {
    return {
        objectNiceName: "Terraform Template",
        search: state.search.text,
        dataLoading: state.terraform.loading.templates,
        data: state.terraform.templates,
        page: state.terraform.templatesPage,
        pages: state.terraform.templatesPages,
        tableColumns: TerraformTemplatesTableColumns,
    }
}

let mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getData: (page = 1, page_size = 10, search = "") => {
            api.getTemplates(page, page_size, search)
        },
        createObject: (payload) => {
            const req = api.createTemplate(payload)
            req.then((res) => {
                ownProps.history.push("./templates/" + res.data.slug)
            })
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(DashboardListView)
