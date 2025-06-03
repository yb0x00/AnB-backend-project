export class UnauthorizedError extends Error {
    status: number;

    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
        this.status = 403;
    }
}
