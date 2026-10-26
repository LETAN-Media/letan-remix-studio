import type { Route } from "next";
import { redirect } from "next/navigation";

export default function NewProjectPage() {
  redirect("/remix?new=1" as Route);
}
