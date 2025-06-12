export default function Loading() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75" />
          <div className="text-gray-600 text-sm">กำลังโหลดข้อมูล กรุณารอสักครู่...</div>
        </div>
      </div>
    );
  }