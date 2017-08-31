import { connect } from "react-redux"
import DashboardListView from "./DashboardListView"
import * as api from "../api/terraform"

const TerraformNamespacesTableColumns = [
    {
        Header: "",
        accessor: "link",
        maxWidth: 35,
        sortable: false,
        resizable: false,
    },
    {
        Header: "Namespace",
        accessor: "title",
        sort: "asc",
        sortable: false,
        maxWidth: 200,
    },
    {
        Header: "Description",
        accessor: "description",
        sortable: false,
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
        objectNiceName: "Terraform Namespace",
        search: state.search.text,
        dataLoading: state.terraform.loading.namespaces,
        data: state.terraform.namespaces,
        page: state.terraform.namespacesPage,
        pages: state.terraform.namespacesPages,
        tableColumns: TerraformNamespacesTableColumns,
    }
}

let mapDispatchToProps = (dispatch, ownProps) => {
    return {
        getData: (page = 1, page_size = 10, search = "") => {
            api.getNamespaces(page, page_size, search)
        },
        createObject: (payload) => {
            const req = api.createNamespace(payload)
            req.then((res) => {
                ownProps.history.push("./namespaces/" + res.data.slug)
            })
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(DashboardListView)
