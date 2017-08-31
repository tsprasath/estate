/*global dispatch*/
import { isArray, each } from "lodash"
import Notifications from "react-notification-system-redux"

var count = 1

export function log(level, message, timeout=0) {
    dispatch(Notifications.show({
        uid: count++,
        message: message,
        position: "tl",
        autoDismiss: timeout,
        dismissible: true,
    }, level))
}

export function success(message) {
    log("success", message, 3)
}

export function info(message) {
    log("info", message, 10)
}

export function warn(message) {
    log("warning", message)
}

export function error(message) {
    log("error", message)
}

export function handleResponseError(err) {
    if (err.response) {
        var message = ""
        if (isArray(err.response.data.errors)) {
            each(err.response.data.errors, (item) => {
                message += item.detail + "\n"
            })
        } else {
            message += err.response.data.errors.detail
        }
        dispatch(Notifications.show({
            uid: count++,
            title: `[${err.response.data.status_code}] ${err.response.data.status_text}`,
            message: message,
            position: "tl",
            autoDismiss: 0,
            dismissible: true,
        }, "error"))
    } else {
        if (!err.stack) {
            error("[" + err.name + "] " + err.message)
        } else {
            error(err.stack.split("\n")[0] + " " + err.stack.split("\n")[1])
        }
    }
}
