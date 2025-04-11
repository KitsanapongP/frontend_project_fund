"use client";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { GetDataproject } from "../../fetch_api/fetch_api_user"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import { FiDownload } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import Swal from "sweetalert2";
import Aos from "aos";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import {
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaPaperPlane,
} from "react-icons/fa";
// ยังไม่รายงาน,รายงานแล้ว,เกินกำหนด,ส่งรายงาน

export default function DatatableProject() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleDownloadClick = (row) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  const handleModalSelect = (type, row) => {
    setShowModal(false);
    if (type === "word") {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun("สวัสดีจากไฟล์ Word!"),
                  new TextRun({
                    text: " ตัวหนา",
                    bold: true,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, "example.docx");
      });
    } else if (type === "pdf") {
      const doc = new jsPDF();
      doc.setFont("THSarabunNew"); // ถ้าใช้ font ภาษาไทย ต้อง embed เพิ่ม
      doc.setFontSize(16);
      doc.text("text", 10, 10);
      doc.save("output.pdf");
    }
  };
  useEffect(() => {
    Aos.init({
      duration: 500,
      once: false,
    });
  });
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
      name: "สถานะ",
      sortable: true,
      cell: (row) => (
        <div>
          <FaClock className="text-yellow-500 text-2xl ms-2" />
        </div>
      ),
    },
    {
      name: "ดาวน์โหลด",
      ignoreRowClick: true,
      cell: (row) => (
        <button
          className="flex items-center gap-2 btn btn-sm btn-outline-primary hover:text-blue-500 rounded hover:bg-gray-100 p-2"
          onClick={() => handleDownloadClick(row)}
        >
          <FiDownload className="text-lg " />
          PDF
        </button>
      ),
    },
    {
      name: "รายงาน",
      cell: (row) => (
        <div style={{ padding: "5px" }}>
          <button
            className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
            onClick={() => {
              //   เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
              sessionStorage.setItem(
                "project_data",
                JSON.stringify({
                  id: row.id_project,
                  number: row.project_number,
                  name: row.project_name,
                  budget: row.budget,
                })
              );

              //   // เปลี่ยนหน้า
              window.location.href = `/user/project/report`;
            }}
          >
            <HiOutlineDocumentReport className="w-6 h-6 text-gray-500 " />
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
            onClick={() => {}}
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
      <DownloadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleModalSelect}
        row={selectedRow}
      />
    </div>
  );
}

function DownloadModal({ isOpen, onClose, onSelect, row }) {
  useEffect(() => {
    // กด esc แล้วปืด
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    // handleKeyDown คือฟังก์ชันที่ฟัง event การกดปุ่มบนคีย์บอร์ด (เช่น Escape)
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    // ใช้ลบ event listener เพื่อป้องกันปัญหา memory leak หรือ event ถูกเรียกซ้ำซ้อน
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/75 bg-opacity-50">
      <div
        data-aos="fade-down"
        className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
      >
        {/* ปุ่มกากบาท */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <span className="text-3xl">&times;</span>
        </button>

        <div className="flex justify-center items-center flex-col">
          <div className="flex items-center justify-center bg-yellow-300 text-white rounded-full w-16 h-16 text-3xl font-bold shadow-lg mb-4">
            ?
          </div>

          <h2 className="text-lg font-semibold text-center mb-4">
            เลือกประเภทไฟล์ที่ต้องการดาวน์โหลด
          </h2>
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => onSelect("pdf", row)}
            className="bg-red-600 text-white px-4  py-2 cursor-pointer rounded hover:bg-red-400"
          >
            PDF
          </button>
          <button
            onClick={() => onSelect("word", row)}
            className="bg-blue-600 text-white px-4 py-2 cursor-pointer rounded hover:bg-blue-400"
          >
            Word
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 cursor-pointer rounded hover:bg-gray-400"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
