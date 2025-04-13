"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDataprojectByidaction } from "../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
export default function DatatableProject({id_action, val }) {
  const [data, setData] = useState([]);
  const { id_strategic, id_actionplan } = val;
  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        const res = await GetDataprojectByidaction(token, id_action);
        // console.log(res.data);
        setData(res.data);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();
  }, []);

  const columns = [
    {
      name: "รหัส",
      selector: (row) => row.project_number,
      sortable: true,
    },
    {
      name: "ชื่อ",
      selector: (row) => row.project_name,
      sortable: true,
      wrap: true,
      width: "450px",
    },
    {
      name: "กิจกรรม",
      selector: (row) => row.status,
      sortable: true,
    },
    {
      name: "งบประมาณ (บาท)",
      // selector: (row) => row.budget,
      sortable: true,
      wrap: true,
      cell: (row) =>
        `${Number(row.budget).toLocaleString("th-TH", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} `,
    },
    {
      name: "ใช้ไป (บาท)",
      sortable: true,
      cell: (row) =>
        `${Number(row.spend_money).toLocaleString("th-TH", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} `,
    },
    {
      name: "คงเหลือ (บาท)",
      sortable: true,
      cell: (row) =>
        `${Number(row.budget - row.spend_money).toLocaleString("th-TH", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} `,
    },
    {
      name: "สถานะ",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <Switch
            onChange={() => confirmToggleStatus(row)}
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
      name: "ดำเนินการ",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <button
            className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
            onClick={() => {
              // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
              sessionStorage.setItem(
                "project_data",
                JSON.stringify({
                  id:row.project_id,
                  name: row.project_name,
                  budget: row.budget,
                })
              );

              // เปลี่ยนหน้า
              window.location.href = `/admin/strategic/${id_strategic}/${id_actionplan}/${row.project_number}`;
            }}
          >
            <i className="bi bi-eye text-gray-500 text-xl group-hover:text-blue-500"></i>
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
    {
      name: "แก้ไข",
      cell: (row) => (
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
      ),
      ignoreRowClick: true,
    },
    {
      name: "ลบ",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          {" "}
          <button
            className="rounded border-gray-200 p-2 hover:bg-gray-100 hover:text-red-500 "
            onClick={() => handleDelete(row)} // เรียกใช้ฟังก์ชัน handleDelete เมื่อกดปุ่ม
          >
            <i className="bi bi-trash text-xl "></i>
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];
  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-300"></div>
          <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
