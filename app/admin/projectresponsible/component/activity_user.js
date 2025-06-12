"use client";
import { useEffect, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { GetDataactivityUserByYear } from "../../../fetch_api/fetch_api_admin"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import { FiDownload } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import Swal from "sweetalert2";
import Aos from "aos";
import { MdEmail } from "react-icons/md";
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

export default function DatatableProject({ year_id ,onTotalChange}) {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [SecrchData, setSecrchData] = useState([]);
  const [SearchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // default เป็น 10
  const [hasMounted, setHasMounted] = useState(false);

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
  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const token = Cookies.get("token");
  //       // console.log("token : ", id_project);
  //       // console.log(year_id);
  //       const res = await GetDataactivityUserByYear(token, year_id);

  //       setData(res.data);
  //       setSecrchData(res.data);
  //     } catch (err) {
  //       console.error("Error loading data:", err);
  //     }
  //   }

  //   fetchData();
  // }, [year_id]);

  const fetchData = useCallback(
    async (page = 1, perPage = 10) => {
      try {
        setLoading(true);
        const token = Cookies.get("token");
        // console.log("token : ", id_projectref);
        const res = await GetDataactivityUserByYear(
          token,
          year_id,
          page,
          perPage
        );
        console.log(res.data);
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
    },
    [year_id]
  );
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
      const budget = Number(data.activity.budget);
      const spendMoney = Number(data.activity.spend_money);
      const remainingBudget = budget - spendMoney; // คำนวณเหมือนใน cell

      return `${data.activity.name_activity} ${budget} ${spendMoney} ${remainingBudget}`
        .toLowerCase()
        .includes(SearchTerm.toLowerCase());
    });

    setSecrchData(filtered);
  }, [SearchTerm, data]);

  const columns = [
    {
      name: "ลำดับ",
      selector: (row,index) => index+1,
      sortable: true,
      width: "100px",
    },
    {
      name: "ชื่อ",
      selector: (row) => row.activity.name_activity,
      sortable: true,
      wrap: true,
      width: "300px",
      cell: (row) => (
        <div style={{ padding: "10px 0px" }}>{row.activity.name_activity}</div>
      ),
    },
    {
      name: "รายงานผล",
      selector: (row) => row.activity.activity_detail_count,
      sortable: true,
      center: "true",
      width: "160px",
      cell: (row) => (
        <div className="flex items-center h-full">
          {row.activity.activity_detail_count}
        </div>
      ),
    },
    {
      name: "งบประมาณ (บาท)",
      selector: (row) => row.activity.budget,
      sortable: true,
      wrap: true,
      right: "true",
      width: "160px",
      cell: (row) =>
        `${Number(row.activity.budget).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "ใช้ไป (บาท)",
      sortable: true,
      selector: (row) => row.activity.spend_money,
      right: "true",
      width: "160px",
      cell: (row) =>
        `${Number(row.activity.spend_money).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "คงเหลือ (บาท)",
      sortable: true,
      right: "true",
      selector: (row) => row.activity.budget - row.activity.spend_money,
      width: "160px",
      cell: (row) =>
        `${Number(
          row.activity.budget - row.activity.spend_money
        ).toLocaleString("th-TH", {
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

        switch (row.activity.status_report) {
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
      name: "ดำเนินการ",
      cell: (row) => (
        <>
          <div style={{ padding: "5px" }}>
            <button
              className="rounded border-gray-200 p-2 hover:bg-gray-100 group "
              onClick={() => {
                // เก็บข้อมูลที่ต้องส่งไว้ใน sessionStorage
                sessionStorage.setItem(
                  "activitydetail_data",
                  JSON.stringify({
                    id: row.activity.activity_id,
                    name: row.activity.name_activity,
                    budget: row.activity.budget,
                    Balance: row.activity.budget - row.activity.spend_money,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `/admin/projectresponsible/activity/${row.activity.id}`;
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
                    name: row.activity.strategic_name,
                    budget: row.activity.budget,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `/admin/strategic/${row.activity.strategic_number}`;
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
        <>
          <div>
            <div>
              <input
                type="text"
                className="form-control my-3  p-2  w-full  border border-gray-300 rounded-md"
                placeholder="ค้นหา..."
                value={SearchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div
              className="bg-white  rounded-md border border-gray-200 shadow-xl  "
              style={{
                height: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <DataTable
                columns={columns}
                data={SecrchData}
                keyField="activity_id"
                pagination
                paginationServer // ← สำคัญ: ใช้ pagination แบบ server
                customStyles={customStyles}
                paginationPerPage={perPage}
                paginationDefaultPage={page}
                paginationTotalRows={totalRows} // ← ส่งจำนวน row ทั้งหมดมาจาก Laravel
                onChangePage={handlePageChange} // ← เรียกเมื่อเปลี่ยนหน้า
                onChangeRowsPerPage={handlePerRowsChange}
                fixedHeaderScrollHeight="100%"
              />
            </div>
          </div>
        </>
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
