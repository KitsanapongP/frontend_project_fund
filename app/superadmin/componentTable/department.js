"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import {
  GetDatadepartmentall,
  UpdatestatusDepartment,
  DeleteDepartment,
} from "../../fetch_api/fetch_api_superadmin"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import Swal from "sweetalert2";
export default function DatatableDepartment({ onEdit }) {
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [SecrchData, setSecrchData] = useState([]);
  const [SearchTerm, setSearchTerm] = useState("");
 

  const handleDelete = async (row) => {
    // const newStatus = row.status === 1 ? 0 : 1;

    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ ?",
      text: `คุณต้องการคุณต้องการลบ "${row.departments_name}" หรือไม่
        `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "gray",
      confirmButtonText: "ยืนยันการลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        const response = await DeleteDepartment(token, row.departments_id);
        // if(response)
        console.log(response);
        if (response) {
          // setData((prevData) =>
          //   prevData.filter((item) => item.departments_id !== row.departments_id)
          // );
          console.log("การลบสำเร็จ");
          setData((prevData) =>
            prevData.filter((item) => item.departments_id != row.departments_id)
          );
          // ทำการดำเนินการเพิ่มเติมที่ต้องการเมื่อการอัปเดตสำเร็จ
          Swal.fire({
            title: "ลบข้อมูลสำเร็จ",
            text: "ข้อมูลถูกลบออกจากระบบแล้ว",
            icon: "success",
            confirmButtonText: "ตกลง",
          });
        } else {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถลบได้ กรุณาลองใหม่อีกครั้ง",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
        }
      } catch (err) {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        console.log(err);
      }
    }
  };

  const columns = [
    {
      name: "ลำดับ",
      selector: (row, index) => (page - 1) * perPage + index + 1,
      sortable: true,
      width: "90px",
    },
    // {
    //   name: "กลยุทธ์",
    //   selector: (row) => row.action_plan_number,
    //   sortable: true,
    //   width: "120px",
    // },
    {
      name: "ชื่อ",
      selector: (row) => row.departments_name,
      sortable: true,
      wrap: true,
      width: "600px",
    },
    {
      name: "สถานะ",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <Switch
            onChange={() => handlechageStatus(row)}
            checked={row.status === 1}
            onColor="#4caf50"
            offColor="#d9534f"
            checkedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%", // ให้ข้อความใช้พื้นที่ของ Switch ทั้งหมด
                  color: "white",
                  fontSize: "12px",
                }}
              >
                เปิด
              </div>
            }
            uncheckedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%", // ให้ข้อความใช้พื้นที่ของ Switch ทั้งหมด
                  color: "white",
                  fontSize: "12px",
                }}
              >
                ปิด
              </div>
            }
          />
        </div>
      ),
      ignoreRowClick: true,
    },
    {
      name: "จัดการ",
      cell: (row) => (
        <>
          <div style={{ padding: "5px" }}>
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 group"
              onClick={() => {
                onEdit(row.departments_name, row.departments_id)
              }}
            >
              <FiEdit2 className="text-xl text-gray-500 group-hover:text-black" />
            </button>
          </div>
          <div style={{ padding: "5px" }}>
            {" "}
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 hover:text-red-500 "
              onClick={() => handleDelete(row)} // เรียกใช้ฟังก์ชัน handleDelete เมื่อกดปุ่ม
            >
              <i className="bi bi-trash text-xl "></i>
            </button>
          </div>
        </>
      ),
      ignoreRowClick: true,
    },
  ];

  useEffect(() => {
    const filtered = data.filter((data) => {
      return `${data.departments_name}`
        .toLowerCase()
        .includes(SearchTerm.toLowerCase());
    });

    setSecrchData(filtered);
  }, [SearchTerm, data]);

  const handlechageStatus = async (row) => {
    const newStatus = row.status === 1 ? 0 : 1;

    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ ?",
      text: `คุณต้องการ  ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"}
        สำหรับ  "${row.departments_name}" หรือไม่
        `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus === 1 ? "#4caf50" : "#d33",
      cancelButtonColor: "gray",
      confirmButtonText: newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const token = Cookies.get("token");
        const response = await UpdatestatusDepartment(
          token,
          row.departments_id
        );
        // if(response)
        console.log(response);
        if (response) {
          console.log("การอัปเดตสถานะสำเร็จ");
          setData((prevData) =>
            prevData.map((item) =>
              item.departments_id === row.departments_id
                ? { ...item, status: newStatus }
                : item
            )
          );
          // ทำการดำเนินการเพิ่มเติมที่ต้องการเมื่อการอัปเดตสำเร็จ
          Swal.fire({
            title: "อัปเดตข้อมูลสำเร็จ",
            // text: ` ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"} ${row.departments_name}`,
            text: "ข้อมูลถูกอัปเดตในระบบแล้ว",
            icon: "success",
            confirmButtonText: "ตกลง",
          });
        } else {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
        }
      } catch (err) {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        console.log(err);
      }
    }
  };

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "#f0f0f0", // สีพื้นหลังหัวตาราง
        color: "#1f2937", // สีตัวอักษร (เทาเข้ม)
        fontWeight: "bold",
        fontSize: "14px",
      },
    },
  };

  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // default เป็น 10
  const [hasMounted, setHasMounted] = useState(false);

  const fetchData = useCallback(async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const res = await GetDatadepartmentall(token, page, perPage);
      setData(res.data);
      setSecrchData(res.data);
      setTotalRows(res.total);

      console.log(res);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      fetchData(page, perPage);
    }
  }, [fetchData, hasMounted, page, perPage]);

  // Fixed handlePageChange function
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Fixed handlePerRowsChange function
  const handlePerRowsChange = (newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-300"></div>
          <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center items-center h-40 text-gray-400">
          ยังไม่มีข้อมูล
        </div>
      ) : (
        <div>
          <input
            type="text"
            className="form-control my-3  p-2  w-full  border border-gray-300 rounded-md"
            placeholder="ค้นหา..."
            value={SearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="bg-white rounded-md border
        border-gray-200 shadow-xl mt-3 
        "
            // style={{ display: "flex", flexDirection: "column" }}
          >
            <DataTable
              // keyField="departments_id"
              columns={columns}
              data={SecrchData}
              customStyles={customStyles}
              pagination
              paginationServer // ← สำคัญ: ใช้ pagination แบบ server
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              paginationTotalRows={totalRows} // ← ส่งจำนวน row ทั้งหมดมาจาก Laravel
              onChangePage={handlePageChange} // ← เรียกเมื่อเปลี่ยนหน้า
              onChangeRowsPerPage={handlePerRowsChange}
              fixedHeaderScrollHeight="100%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
