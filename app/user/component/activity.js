"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDataactivity } from "../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import { HiOutlineDocumentReport } from "react-icons/hi";
export default function DatatableActivity({ val }) {
  const [data, setData] = useState([]);
  const { id_strategic, id_actionplan, id_project } = val;
  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        console.log("token : ", token);
        const res = await GetDataactivity(token, id_project);
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
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: "ชื่อ",
      selector: (row) => row.name_activity,
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

  ];
  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-300"></div>
          <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={data} keyField="activity_id" />
      )}
    </div>
  );
}
