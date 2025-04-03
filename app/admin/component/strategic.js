"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDatastrategic } from "../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import "bootstrap-icons/font/bootstrap-icons.css";
import Link from "next/link";
import Cookies from "js-cookie";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
const columns = [
  {
    name: "รหัส",
    selector: (row) => row.strategic_number,
    sortable: true,
  },
  {
    name: "ชื่อ",
    selector: (row) => row.strategic_name,
    sortable: true,
    wrap: true,
    width: "400px",
  },
  {
    name: "กลยุทธ์",
    selector: (row) => row.status,
    sortable: true,
  },
  {
    name: "โครงการ",
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

export default function DatatableStrig() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        console.log("token : ", token);
        const res = await GetDatastrategic(token);
        console.log(res.data);
        setData(res.data);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();
  }, []);

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
