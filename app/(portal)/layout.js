import { PortalAccessibilityProvider } from "@/app/components/portal/PortalAccessibilityProvider";

export default function PortalLayout({ children }) {
  return <PortalAccessibilityProvider>{children}</PortalAccessibilityProvider>;
}
