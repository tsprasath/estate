import React from "react"
import { connect } from "react-redux"


class Search extends React.Component {
    onChange(value) {
        this.props.setSearchText(value.target.value)
    }
    render() {
        return (
            <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={this.props.search_text}
                onChange={this.onChange.bind(this)}
            />
        )
    }
}

const mapStateToProps = (state) => {
    return {
        search_text: state.search.text,
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
        setSearchText: (value) => {
            dispatch({
                type: "SET_SEARCH",
                payload: value
            })
        },
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(Search)
