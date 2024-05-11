import CustomError from "error/CustomError"

export default class InternalServerError extends CustomError {
    constructor(message: string) {
        super(message, "500 Internal Server Error", 500)
    }
}
