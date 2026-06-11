import InstructorProfile from "../../component/InstructorProfile";

export default async function Page({ params }) {
  const { id } = await params;
  return <InstructorProfile userId={id} />;
}