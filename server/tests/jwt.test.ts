import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";

dotenv.config({path: path.resolve(__dirname, "../.env")});

describe("JWT 생성 테스트", () => {
    it("should generate a valid token", () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET not defined in .env");

        const token = jwt.sign(
            {userId: 1, login_id: "tester"},
            secret,
            {expiresIn: "30d"}
        );

        expect(typeof token).toBe("string");
        // header.payload.signature
        expect(token.split(".")).toHaveLength(3);
    });
});
