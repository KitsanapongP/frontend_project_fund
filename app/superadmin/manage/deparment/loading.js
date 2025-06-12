export default function Loading() {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-300"></div>
      <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
    </div>
  );
}
