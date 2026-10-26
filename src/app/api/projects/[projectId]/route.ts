import { updateProjectSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { deleteOwnedProject, getOwnedProject, updateOwnedProject } from "@/server/services/projects";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    return jsonOk(await getOwnedProject(user.id, projectId));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const input = await readJson(request, updateProjectSchema);
    const project = await updateOwnedProject(user.id, projectId, input);
    await writeAudit({
      actorId: user.id,
      projectId,
      action: "project.updated",
      targetType: "project",
      targetId: projectId,
      metadata: { fields: Object.keys(input) },
    });
    return jsonOk(project);
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { projectId } = await context.params;
    const deleted = await deleteOwnedProject(user.id, projectId);
    return jsonOk(deleted);
  } catch (error) {
    return routeError(error);
  }
}
