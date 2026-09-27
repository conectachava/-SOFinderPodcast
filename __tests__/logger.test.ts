import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger";

describe("logger secret redaction", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        logger.clearLogs();
    });

    it("redacts credential values before writing to the console", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { });

        logger.warn(
            "request token: sensitive-token",
            { apiKey: "sensitive-api-key" },
            "Security"
        );

        expect(warn).toHaveBeenCalledWith(
            "[Security] request token: [REDACTED]",
            { apiKey: "[REDACTED]" }
        );
        expect(warn.mock.calls.flat().join(" ")).not.toContain("sensitive-token");
        expect(warn.mock.calls.flat().join(" ")).not.toContain("sensitive-api-key");
    });
});