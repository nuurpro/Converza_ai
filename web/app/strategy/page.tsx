import { redirect } from "next/navigation";

export default function LegacyStrategyRedirect() {
  redirect("/agents/milo");
}
