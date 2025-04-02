"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDatastrategic } from "../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import "bootstrap-icons/font/bootstrap-icons.css";
import Link from "next/link";
import Cookies from "js-cookie";
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
      `${Number(row.budget).toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} `,
  },
  {
    name: "คงเหลือ (บาท)",
    sortable: true,
    cell: (row) =>
      `${Number(row.budget).toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} `,
  },
  {
    name: "ดำเนินการ",
    cell: (row) => (
      <div style={{ padding: "5px" }}>
        <Link
          href={{
            pathname: `/admin/strategic/${row.strategic_number}`,
            query: { name: row.strategic_name ,
              budget: row.budget
             },
          }}
          className="btn btn-outline-primary"
        >
          <i className="bi bi-eye text-gray-500 text-xl"></i>
        </Link>
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
        const token = Cookies.get('token')
        console.log("token : ", token)
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
