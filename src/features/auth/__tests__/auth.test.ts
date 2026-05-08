import request from "supertest";
import { app } from "../../../app.js";

describe("Auth Integration Tests", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should fail with invalid input", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "J",
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should fail with missing credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
