import Link from "next/link";

export default function PortalPlaceholderPage({ title, description }) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-base text-gray-600">{description}</p>
        <p className="mt-2 text-sm text-gray-500">ส่วนนี้อยู่ระหว่างการเตรียมข้อมูลและฟังก์ชันการใช้งาน</p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
