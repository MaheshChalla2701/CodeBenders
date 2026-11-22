import {
  errorResponse,
  fieldErrorsFrom,
  forbiddenResponse,
  isForbiddenOrigin,
  jsonResponse,
  readJsonBody,
} from "@/lib/api/respond";
import { routeAssistantMessage } from "@/lib/assistant/router";
import { assistantRouteSchema } from "@/lib/schemas/assistant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isForbiddenOrigin(request)) return forbiddenResponse();
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = assistantRouteSchema.safeParse(body.body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Enter a valid assistant message.",
      fieldErrorsFrom(parsed.error.issues),
    );
  }

  return jsonResponse({
    success: true,
    data: routeAssistantMessage(parsed.data.message),
  });
}
