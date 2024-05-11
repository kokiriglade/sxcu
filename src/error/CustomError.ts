export default class CustomError extends Error {
    public statusStr: string
    public statusCode: number

    constructor(message: string, statusStr: string, statusCode: number) {
        super(message)
        this.statusStr = statusStr
        this.statusCode = statusCode
        Object.setPrototypeOf(this, CustomError.prototype)
    }

    toString() {
        return `${this.statusStr}: ${this.message}`
    }
}
