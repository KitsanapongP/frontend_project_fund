"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import {
  GetDataprojectByidaction,
  DeleteProject,
} from "../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import Swal from "sweetalert2";
import { MdEmail } from "react-icons/md";
export default function DatatableProject({ id_action, val, onTotalChange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [SecrchData, setSecrchData] = useState([]);
  const [SearchTerm, setSearchTerm] = useState("");
  const { id_strategic, id_actionplan } = val;

  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // default เป็น 10
  const [hasMounted, setHasMounted] = useState(false);

  const fetchData = useCallback(async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const res = await GetDataprojectByidaction(
        token,
        id_action,
        page,
        perPage
      );
      // console.log(res.data);
      setData(res.data);
      setSecrchData(res.data);
      setTotalRows(res.total);
      if (onTotalChange) {
        onTotalChange(res.total);
      }

      // console.log(res);
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

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  const handlePerRowsChange = (newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };
  useEffect(() => {
    const filtered = data.filter((data) => {
      const budget = Number(data.budget);
      const spendMoney = Number(data.spend_money);
      const remainingBudget = budget - spendMoney; // คำนวณเหมือนใน cell

      return `${data.project_name} ${data.project_number} ${budget} ${spendMoney} ${remainingBudget}`
        .toLowerCase()
        .includes(SearchTerm.toLowerCase());
    });

    setSecrchData(filtered);
  }, [SearchTerm, data]);

  const columns = [
    {
      name: "รหัส",
      selector: (row) => row.project_number,
      sortable: true,
      width: "80px",
    },
    {
      name: "ชื่อ",
      selector: (row) => row.project_name,
      sortable: true,
      wrap: true,
      width: "350px",
      cell: (row) => <div className="py-[10px]">{row.project_name} </div>,
    },
    {
      name: "กิจกรรม",
      selector: (row) => row.count_activity,
      sortable: true,
      center: "true",
    },
    {
      name: "รายงานเรียบร้อย",
      selector: (row) => row.count_activity_report,
      sortable: true,
      width: "160px",
      center: "true",
    },
    {
      name: "ยังไม่ได้รายงาน",
      selector: (row) => row.count_activity - row.count_activity_report,
      sortable: true,
      center: "true",
      width: "160px",
    },
    {
      name: "งบประมาณ (บาท)",
      // selector: (row) => row.budget,
      sortable: true,
      wrap: true,
      right: "true",
      selector: (row) => row.budget,
      width: "160px",
      cell: (row) =>
        `${Number(row.budget).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "ใช้ไป (บาท)",
      sortable: true,
      right: "true",
      selector: (row) => row.spend_money,
      width: "160px",
      cell: (row) =>
        `${Number(row.spend_money).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "คงเหลือ (บาท)",
      sortable: true,
      right: "true",
      selector: (row) => row.budget - row.spend_money,
      width: "160px",
      cell: (row) =>
        `${Number(row.budget - row.spend_money).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "สถานะรายงาน",
      width: "200px",
      sortable: true,
      center: "true",
      cell: (row) => {
        let text = "";
        let bg = "";

        switch (row.status_report) {
          case 0:
            text = "ยังไม่มีการรายงาน";
            bg = "bg-yellow-200 text-yellow-800";
            break;
          case 1:
            text = "มีการรายงานเรียบร้อย";
            bg = "bg-green-200 text-green-800";
            break;
          case 2:
            text = "หมดเวลารายงานโดยไม่มีการรายงาน";
            bg = "bg-red-200 text-red-800";
            break;
          default:
            text = "-";
            bg = "bg-gray-200 text-gray-800";
        }

        return (
          <span className={`px-2 py-1 rounded text-sm font-medium ${bg}`}>
            {text}
          </span>
        );
      },
    },
    {
      name: "จัดการ",
      cell: (row) => (
        <>
          <div style={{ padding: "5px" }}>
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
              onClick={() => {
                // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
                sessionStorage.setItem(
                  "project_data",
                  JSON.stringify({
                    id: row.project_id,
                    name: row.project_name,
                    budget: row.budget,
                    Balance: row.budget - row.spend_money,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `/admin/strategic/${id_strategic}/${id_actionplan}/${row.project_number}`;
              }}
            >
              <i className="bi bi-eye text-gray-500 text-xl group-hover:text-blue-500"></i>
            </button>
          </div>
          <div style={{ padding: "5px" }}>
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 group"
              onClick={() => {
                // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
                sessionStorage.setItem(
                  "strategic_data",
                  JSON.stringify({
                    name: row.strategic_name,
                    budget: row.budget,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `/admin/strategic/${row.strategic_number}`;
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

  const handleDelete = async (row) => {
    // const newStatus = row.status === 1 ? 0 : 1;

    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ ?",
      text: `คุณต้องการคุณต้องการลบ "${row.project_name}" หรือไม่
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
        const response = await DeleteProject(token, row.project_id);
        // if(response)
        console.log(response);
        if (response) {
          // setData((prevData) =>
          //   prevData.filter((item) => item.strategic_id !== row.strategic_id)
          // );
          console.log("การลบสำเร็จ");
          setData((prevData) =>
            prevData.filter((item) => item.project_id != row.project_id)
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
        <div className="">
          <input
            type="text"
            className="form-control my-3  p-2  w-full  border border-gray-300 rounded-md"
            placeholder="ค้นหา..."
            value={SearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            className="bg-white rounded-md border border-gray-200
 mt-3 flex flex-col"
            style={{
              height: "90vh",
            }}
          >
            <DataTable
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
