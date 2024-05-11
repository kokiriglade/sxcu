import CustomError from "error/CustomError"

export default class PayloadTooLargeError extends CustomError {
    constructor(message: string) {
        super(message, "413 Payload Too Large", 413)
    }
}
