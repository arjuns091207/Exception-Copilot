require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const supabase = require("../src/config/supabase");
const approvalService = require("../src/services/approval.service");

afterEach(() => mock.restoreAll());

test("submits an approval decision through the atomic RPC", async () => {
    const expected = {
        approval_id: "approval-uuid",
        exception_id: "exception-uuid",
        analysis_id: "analysis-uuid",
        decision: "approved"
    };

    mock.method(supabase, "rpc", async (name, args) => {
        assert.equal(name, "decide_exception_approval");
        assert.equal(args.p_exception_code, "EX-1001");
        assert.equal(args.p_analysis_id, "analysis-uuid");
        assert.equal(args.p_user_id, "reviewer-uuid");
        assert.equal(args.p_decision, "approved");
        return { data: expected, error: null };
    });

    const result = await approvalService.decideException({
        exceptionCode: "EX-1001",
        analysisId: "analysis-uuid",
        userId: "reviewer-uuid",
        decision: "approved",
        reason: "Validated"
    });

    assert.deepEqual(result, expected);
});

test("submits rejection decisions through the same RPC", async () => {
    mock.method(supabase, "rpc", async (name, args) => {
        assert.equal(args.p_decision, "rejected");
        assert.equal(args.p_reason, "Unsafe recommendation");
        return { data: { decision: "rejected" }, error: null };
    });

    const result = await approvalService.decideException({
        exceptionCode: "EX-1001",
        analysisId: "analysis-uuid",
        userId: "reviewer-uuid",
        decision: "rejected",
        reason: "Unsafe recommendation"
    });

    assert.equal(result.decision, "rejected");
});

test("maps stale or duplicate decisions to conflict", async () => {
    mock.method(supabase, "rpc", async () => ({
        data: null,
        error: { message: "A decision already exists for this exception" }
    }));

    await assert.rejects(
        approvalService.decideException({
            exceptionCode: "EX-1001",
            analysisId: "analysis-uuid",
            userId: "reviewer-uuid",
            decision: "approved"
        }),
        { status: 409 }
    );
});

test("maps reviewer authorization failures to conflict", async () => {
    mock.method(supabase, "rpc", async () => ({
        data: null,
        error: { message: "Reviewer or admin role required" }
    }));

    await assert.rejects(
        approvalService.decideException({
            exceptionCode: "EX-1001",
            analysisId: "analysis-uuid",
            userId: "operator-uuid",
            decision: "approved"
        }),
        { status: 409 }
    );
});

test("maps unexpected database failures to server errors", async () => {
    mock.method(supabase, "rpc", async () => ({
        data: null,
        error: { message: "Database connection unavailable" }
    }));

    await assert.rejects(
        approvalService.decideException({
            exceptionCode: "EX-1001",
            analysisId: "analysis-uuid",
            userId: "reviewer-uuid",
            decision: "approved"
        }),
        { status: 500 }
    );
});
