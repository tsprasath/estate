import React from "react"
import { connect } from "react-redux"
import Notifications from "react-notification-system-redux"


class Messages extends React.Component {
    render() {
        return (
            <Notifications notifications={this.props.notifications}/>
        )
    }
}

function mapStateToProps(state) {
    return {
        notifications: state.notifications,
    }
}

export default connect(mapStateToProps)(Messages)
