"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDataproject } from "../../fetch_api/fetch_api_user"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import { HiOutlineDocumentReport } from "react-icons/hi";
export default function DatatableProject() {
  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        // console.log("token : ", id_project);
        const res = await GetDataproject(token);
        console.log(res.data);
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
      name: "รายงาน",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <button
            className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
            onClick={() => {
              // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
            //   sessionStorage.setItem(
            //     "project_data",
            //     JSON.stringify({
            //       name: row.project_name,
            //       budget: row.budget,
            //     })
            //   );

            //   // เปลี่ยนหน้า
            //   window.location.href = `/user/project/${row.project_number}`;
            }}
          >
            <HiOutlineDocumentReport className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
    {
      name: "ดูกิจกรรม",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <button
            className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
            onClick={() => {
              // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
              sessionStorage.setItem(
                "project_data",
                JSON.stringify({
                  name: row.project_name,
                  budget: row.budget,
                  balance: row.budget - row.spend_money,
                })
              );

              // เปลี่ยนหน้า
              window.location.href = `/user/project/${row.project_number}`;
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
            
            }}
          >
            <FiEdit2 className="text-xl text-gray-500 group-hover:text-black" />
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
