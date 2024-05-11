import CustomError from "error/CustomError"

export default class UnauthorizedError extends CustomError {
    constructor(message: string) {
        super(message, "401 Unauthorized", 401)
    }
}
