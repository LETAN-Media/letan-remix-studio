import { createProjectSchema } from "@/domain/project-schema";
import { jsonOk, readJson, requireApiUser, routeError } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { createOwnedProject, listOwnedProjects } from "@/server/services/projects";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    return jsonOk(await listOwnedProjects(user.id));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const input = await readJson(request, createProjectSchema);
    const project = await createOwnedProject(user.id, input);
    await writeAudit({
      actorId: user.id,
      projectId: project.id,
      action: "project.created",
      targetType: "project",
      targetId: project.id,
    });
    return jsonOk(project, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
