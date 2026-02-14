import { ExplorerProvider } from "@/context/ExplorerContext";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExplorerProvider>{children}</ExplorerProvider>;
}
