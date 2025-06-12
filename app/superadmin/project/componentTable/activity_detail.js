"use client";
import { useEffect, useState,useCallback } from "react";
import DataTable from "react-data-table-component";
import {
  GetDataactivitydetailByidactivity,
} from "../../fetch_api/fetch_api_user"; // ปรับ path ตามจริง
import Link from "next/link";
import Cookies from "js-cookie";
import { HiOutlineDocumentReport } from "react-icons/hi";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FiEdit2 } from "react-icons/fi";
import Switch from "react-switch";
import Swal from "sweetalert2";
export default function DatatableActivityDetail({
  id_activityref,
  val,
  onEditTotal,
  Balance,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [SecrchData, setSecrchData] = useState([]);
  const {id_project, id_activity, total } = val;
  const [SearchTerm, setSearchTerm] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // default เป็น 10
  const [hasMounted, setHasMounted] = useState(false);

  const fetchData = useCallback(async (page = 1, perPage = 10) => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      console.log("token : ", id_activityref);
      const res = await GetDataactivitydetailByidactivity(
        token,
        id_activityref,
        page,
        perPage
      );
      console.log(res.data);
      setData(res.data);
      setSecrchData(res.data);
      setTotalRows(res.total);
      onEditTotal(res.total);
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
      return `${data.detail} ${data.start_date} ${data.price} ${data.station} `
        .toLowerCase()
        .includes(SearchTerm.toLowerCase());
    });

    setSecrchData(filtered);
  }, [SearchTerm, data]);

  const columns = [
    {
      name: "ลำดับ",
      cell: (row, index) => index + 1,
      sortable: true,
      width: "100px",
    },
    {
      name: "ชื่อ",
      selector: (row) => (row.detail ? row.detail : "-"),
      sortable: true,
      wrap: true,
      width: "250px",
      cell: (row) => <div style={{ padding: "10px 0px" }}>{row.detail}</div>,
    },
    {
      name: "วันที่ดำเนินงาน ( ว/ด/ป )",
      selector: (row) => row.start_date,
      sortable: true,
      center: "true",
      wrap: true,
      width: "200px",
      cell: (row) => {
        const date = new Date(row.start_date);
        const formatted =
          date.getDate().toString().padStart(2, "0") +
          "/" +
          (date.getMonth() + 1).toString().padStart(2, "0") +
          "/" +
          date.getFullYear();
        return formatted;
      },
    },
    {
      name: "วันที่รายงาน ( ว/ด/ป )",
      selector: (row) => row.created_at,
      sortable: true,
      center: "true",
      wrap: true,
      width: "200px",
      cell: (row) => {
        const date = new Date(row.created_at);
        const formatted =
          date.getDate().toString().padStart(2, "0") +
          "/" +
          (date.getMonth() + 1).toString().padStart(2, "0") +
          "/" +
          date.getFullYear();
        return formatted;
      },
    },
    {
      name: "งบประมาณ (บาท)",
      // selector: (row) => row.budget,
      sortable: true,
      wrap: true,
      right: "true",
      width: "160px",
      cell: (row) =>
        `${Number(row.price).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `,
    },
    {
      name: "สถานที่",
      center: "true",
      selector: (row) => row.station,
      sortable: true,
      width: "200px",
      cell: (row) => (
        <div className="flex items-center h-full">{row.station}</div>
      ),
    },
    {
      name: "ไฟล์",
      ignoreRowClick: true,
      cell: (row) =>
        row.report_data !== "-" || row.report_data ? (
          <a
            className="flex items-center gap-2 btn btn-sm btn-outline-primary hover:text-blue-500 rounded hover:bg-gray-100 p-2"
            href={row.report_data}
            target="_blank"
            rel="noopener noreferrer"
          >
            <HiOutlineDocumentReport className="text-lg " />
            ไฟล์
          </a>
        ) : (
          "-"
        ),
    },

    {
      name: "ดำเนินการ",
      cell: (row, index) => (
        <>
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

                sessionStorage.setItem(
                  "activity_data_edit",
                  JSON.stringify({
                    id: row.activity_detail_id,
                    detail: row.detail,
                    station: row.station,
                    total_price: row.price,
                    start_date: row.start_date,
                    end_date: row.end_date,
                    report_data: row.report_data,
                  })
                );

                // เปลี่ยนหน้า
                window.location.href = `./${id_activity}/edit_report?total=${
                  index + 1
                }&maxBudget=${Balance}`;
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

  const handlechageStatus = async (row) => {
    const newStatus = row.status === 1 ? 0 : 1;

    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ ?",
      text: `คุณต้องการ  ${newStatus === 1 ? "เปิดการใช้งาน" : "ปิดการใช้งาน"}
            สำหรับ  "${row.name_activity}" หรือไม่
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
        const response = await UpdatestatusActivityDetail(
          token,
          row.activity_detail_id
        );
        // if(response)
        console.log(response);
        if (response) {
          console.log("การอัปเดตสถานะสำเร็จ");
          setData((prevData) =>
            prevData.map((item) =>
              item.activity_detail_id === row.activity_detail_id
                ? { ...item, status: newStatus }
                : item
            )
          );
          Swal.fire({
            title: "อัปเดตข้อมูลสำเร็จ",
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

  const handleDelete = async (row) => {
    // const newStatus = row.status === 1 ? 0 : 1;

    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่ ?",
      text: `คุณต้องการคุณต้องการลบ "${row.detail}" หรือไม่
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
        const response = await DeleteActivityDetail(
          token,
          row.activity_detail_id
        );
        // if(response)
        console.log(response);
        if (response) {
          // setData((prevData) =>
          //   prevData.filter((item) => item.strategic_id !== row.strategic_id)
          // );
          console.log("การลบสำเร็จ");
          // 1. Parse ข้อมูลจาก sessionStorage
          const parsedData = JSON.parse(
            sessionStorage.getItem("activitydetail_data") || "{}"
          );
          const parsedProjectData = JSON.parse(
            sessionStorage.getItem("project_data") || "{}"
          );
          const parsedStrategicData = JSON.parse(
            sessionStorage.getItem("strategic_data") || "{}"
          );
          const parsedActionplanData = JSON.parse(
            sessionStorage.getItem("actionplan_data") || "{}"
          );

          // 2. ดึงข้อมูล spend summary จาก response
          const spendSummary = response?.original?.remain_budget_summary ?? {};

          // 3. อัปเดต Balance
          const updatedParsed = {
            ...parsedData,
            // actionplan_remain_budget
            Balance: spendSummary.activity_remain_budget ?? 0,
          };

          const updatedStrategic = {
            ...parsedStrategicData,
            Balance: spendSummary.strategic_remain_budget ?? 0,
          };

          const updatedActionplan = {
            ...parsedActionplanData,
            Balance: spendSummary.actionplan_remain_budget ?? 0,
          };

          const updatedProject = {
            ...parsedProjectData,
            Balance: spendSummary.project_remain_budget ?? 0,
          };

          // 4. เซฟกลับเข้า sessionStorage
          sessionStorage.setItem(
            "activitydetail_data",
            JSON.stringify(updatedParsed)
          );
          sessionStorage.setItem(
            "strategic_data",
            JSON.stringify(updatedStrategic)
          );
          sessionStorage.setItem(
            "actionplan_data",
            JSON.stringify(updatedActionplan)
          );
          sessionStorage.setItem(
            "project_data",
            JSON.stringify(updatedProject)
          );
          setData((prevData) =>
            prevData.filter(
              (item) => item.activity_detail_id != row.activity_detail_id
            )
          );
          // ทำการดำเนินการเพิ่มเติมที่ต้องการเมื่อการอัปเดตสำเร็จ
          Swal.fire({
            title: "ลบข้อมูลสำเร็จ",
            text: "ข้อมูลถูกลบออกจากระบบแล้ว",
            icon: "success",
            confirmButtonText: "ตกลง",
          }).then(() => {
            window.location.reload();
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
            style={{ height: "90vh", display: "flex", flexDirection: "column" }}
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
