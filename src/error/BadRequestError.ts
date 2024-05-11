import CustomError from "error/CustomError"

export default class BadRequestError extends CustomError {
    constructor(message: string) {
        super(message, "400 Bad Request", 400)
    }
}
