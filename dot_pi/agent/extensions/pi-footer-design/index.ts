import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

type FooterTheme = Pick<ExtensionContext["ui"]["theme"], "fg">;
type ThemeColor = Parameters<FooterTheme["fg"]>[0];
type ThinkingLevel = ReturnType<ExtensionAPI["getThinkingLevel"]>;

function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}

function formatCount(value: number): string {
	if (!Number.isFinite(value) || value < 0) return "0";
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	return `${Math.round(value)}`;
}

function formatCost(value: number): string {
	if (!Number.isFinite(value) || value < 0) return "$0.000";
	return `$${value.toFixed(3)}`;
}

function getSessionCost(ctx: ExtensionContext): number {
	let total = 0;

	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "message") continue;
		if (entry.message.role !== "assistant") continue;

		const message = entry.message as AssistantMessage;
		const cost = message.usage?.cost?.total;
		if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0) continue;
		total += cost;
	}

	return total;
}

function getContextPercentColor(percent: number): ThemeColor {
	if (percent >= 80) return "error";
	if (percent >= 50) return "warning";
	return "success";
}

function buildContextSegment(ctx: ExtensionContext, theme: FooterTheme): string | undefined {
	const usage = ctx.getContextUsage();
	if (!usage) return undefined;

	const tokens = usage.tokens;
	if (!Number.isFinite(tokens) || tokens < 0) return undefined;

	const limit = usage.limit ?? ctx.model?.contextWindow;
	const hasLimit = typeof limit === "number" && Number.isFinite(limit) && limit > 0;
	const hasPercent = typeof usage.percent === "number" && Number.isFinite(usage.percent);

	if (hasLimit && hasPercent) {
		const percent = Math.max(0, usage.percent);
		return `${theme.fg(getContextPercentColor(percent), `${Math.round(percent)}%`)}${theme.fg(
			"muted",
			` ctx (${formatCount(tokens)}/${formatCount(limit)})`,
		)}`;
	}

	if (hasLimit) {
		return theme.fg("muted", `${formatCount(tokens)}/${formatCount(limit)} ctx`);
	}

	return theme.fg("muted", `${formatCount(tokens)} ctx`);
}

function buildThinkingSegment(theme: FooterTheme, thinkingLevel: ThinkingLevel): string | undefined {
	if (thinkingLevel === "off") return undefined;
	return theme.fg("muted", thinkingLevel);
}

function buildSummarySegments(ctx: ExtensionContext, theme: FooterTheme, pi: ExtensionAPI): string[] {
	const context = buildContextSegment(ctx, theme);
	const model = theme.fg("accent", ctx.model?.id ?? "no-model");
	const thinking = buildThinkingSegment(theme, pi.getThinkingLevel());
	const cost = theme.fg("dim", formatCost(getSessionCost(ctx)));

	return [context, model, thinking, cost].filter(isDefined);
}

function joinSegments(theme: FooterTheme, segments: readonly string[]): string {
	if (segments.length === 0) return "";
	const separator = theme.fg("dim", " · ");
	return segments.join(separator);
}

function fitRightSummary(width: number, theme: FooterTheme, segments: readonly string[]): string {
	if (width <= 0 || segments.length === 0) return "";

	const full = joinSegments(theme, segments);
	if (visibleWidth(full) <= width) return full;

	const withoutCost = joinSegments(theme, segments.slice(0, -1));
	if (visibleWidth(withoutCost) <= width) return withoutCost;

	const contextAndModel = joinSegments(theme, segments.slice(0, 2));
	if (visibleWidth(contextAndModel) <= width) return contextAndModel;

	return truncateToWidth(segments[0] ?? "", width, "");
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsubscribe,
				invalidate() {},
				render(width: number): string[] {
					if (width <= 0) return [""];

					const branch = footerData.getGitBranch();
					const left = branch ? theme.fg("accent", branch) : "";
					const rightSegments = buildSummarySegments(ctx, theme, pi);
					const right = fitRightSummary(width, theme, rightSegments);

					if (!left) return [truncateToWidth(right, width, "")];
					if (!right) return [truncateToWidth(left, width, "")];
					if (visibleWidth(left) + 1 + visibleWidth(right) > width) {
						return [truncateToWidth(right, width, "")];
					}

					const padWidth = Math.max(1, width - visibleWidth(left) - visibleWidth(right));
					return [truncateToWidth(`${left}${" ".repeat(padWidth)}${right}`, width, "")];
				},
			};
		});
	});
}
