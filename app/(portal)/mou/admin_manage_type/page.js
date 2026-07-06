import MouLayout from "../components/MouLayout";
import MouUi from "../components/mou_ui";

export default function AdminManageTypePage() {
  return (
    <MouLayout subtitle="จัดการประเภท">
      <MouUi screen="manage" role="admin" noShell />
    </MouLayout>
  );
}
