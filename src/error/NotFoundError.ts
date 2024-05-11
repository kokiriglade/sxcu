import CustomError from "error/CustomError"

export default class NotFoundError extends CustomError {
    constructor(message: string) {
        super(message, "404 Not Found", 404)
    }
}
