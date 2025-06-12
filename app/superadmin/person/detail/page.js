"use client";

import { useState, useEffect } from "react";
import Menu from "../../component/nav_admin";
import Header from "../../component/header";
import Cookies from "js-cookie";
import DatatableUser from "../../componentTable/user";
import DatatableProject from "./tableProject";
import DatatableActivity from "./tableActivity";
import dynamic from "next/dynamic";
import { GetDatayear } from "../../../fetch_api/fetch_api_admin";
import Select from "react-select";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
export default function DetailUser() {
  const [isMounted, setIsMounted] = useState(false);
  const [dataUser, setdatauser] = useState({
    id: null,
    fullname: null,
    Imgurl: null,
    position: null,
  });

  const [state, setState] = useState({
    series: [44, 55, 13, 43, 22],
    options: {
      chart: {
        width: 380,
        type: "pie",
      },
      labels: ["Team A", "Team B", "Team C", "Team D", "Team E"],
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              width: "100%",
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
  });

  const options = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: true, // เพิ่มเครื่องมือดาวน์โหลด
      },
    },
    plotOptions: {
      bar: {
        horizontal: false, // แนวตั้ง
        columnWidth: "55%",
        borderRadius: 5, // โค้งมนด้านบน
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false, // ซ่อนค่าบนแท่งกราฟ
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"], // โปร่งแสงขอบ
    },
    xaxis: {
      categories: [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ],
      title: {
        text: "ปี-เดือน", // ชื่อแกน X
      },
    },
    yaxis: {
      title: {
        text: "จำนวน", // ชื่อแกน Y
      },
    },
    fill: {
      opacity: 1, // ความโปร่งใสของแท่งกราฟ
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "" + val + " จำนวน"; // แสดงหน่วย $ ใน Tooltip
        },
      },
    },
    colors: ["#1E90FF", "#FF6347", "#32CD32"], // สีของแต่ละซีรีส์
    legend: {
      position: "top", // ตำแหน่ง Legend
      horizontalAlign: "center", // จัดกึ่งกลาง
    },
  };

  const series = [
    {
      name: "โครงการ",
      data: ["1", "2", "3", "4"],
    },
    {
      name: "กิจกรรม",
      data: ["3", "6", "7", "8"],
    },
  ];

  const options_line = {
    chart: {
      type: "line", // เปลี่ยนเป็น line
      height: 350,
      toolbar: {
        show: true, // แสดงเครื่องมือดาวน์โหลดและจัดการกราฟ
      },
    },
    markers: {
      size: 6, // ขนาดของจุด
      shape: "circle", // เปลี่ยนเป็นวงกลม
      strokeWidth: 2, // ความหนาของเส้นรอบวง
      strokeColors: "#fff", // สีของเส้นรอบจุด
      fillOpacity: 1, // ความโปร่งแสงของจุด
      hover: {
        size: 8, // ขนาดของจุดเมื่อเมาส์วาง
      },
    },
    dataLabels: {
      enabled: true, // แสดงค่าบนจุดของเส้น
    },
    stroke: {
      curve: "smooth", // เพิ่มความโค้งมนให้เส้น
      width: 3, // ความหนาของเส้น
      colors: ["#1E90FF", "#FF6347", "#32CD32"], // สีของแต่ละซีรีส์
    },
    xaxis: {
      categories: [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ],
      title: {
        text: "ปี-เดือน", // ชื่อแกน X
      },
    },
    yaxis: {
      title: {
        text: "จำนวน", // ชื่อแกน Y
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "" + val + " จำนวน"; // หน่วย $ ใน Tooltip
        },
      },
    },
    colors: ["#1E90FF", "#FF6347", "#32CD32"], // สีของแต่ละซีรีส์
    legend: {
      position: "top", // ตำแหน่ง Legend
      horizontalAlign: "center", // จัดให้อยู่ตรงกลาง
    },
  };
  const [yearOptions, setyearOptions] = useState([]);
  const [year, setyear] = useState();
  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        // console.log("token : ", token);
        const res = await GetDatayear(token);
        setyear(res.data[0].year_id);
        // console.log("year : ", res.data);
        setyearOptions(
          res.data.map((item) => ({
            label: item.year, // เช่น "2568"
            value: item.year_id, // เช่น 1
          }))
        );
        const data_user = sessionStorage.getItem("user_data");
        if (!data_user) {
          window.location.href = `/admin/person`;
        }
        if (data_user) {
          const parsed = JSON.parse(data_user);
          //   setStrategic(parsed);
          console.log("sasa : ", parsed);
          setdatauser((prev) => ({
            ...prev,
            id: parsed.id,
            position: parsed.position,
          }));
          // console.log("set strategic:", data);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();
  }, []);
  useEffect(() => {
    const fullname = Cookies.get("fullname");
    const img = Cookies.get("urlImg");
    setdatauser((prev) => ({
      ...prev,
      fullname: fullname,
      Imgurl: img,
    }));

    setIsMounted(true);
  }, []);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#f9fafb", // สีพื้นหลังที่ต้องการ
      borderColor: "#d1d5db", // สีของขอบ
      padding: "0.125rem", // ขนาด padding
      borderRadius: "0.375rem", // ขอบมุมโค้ง
      width: "100%",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff", // สีพื้นหลังของ dropdown
      borderColor: "#d1d5db",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#4caf50" : "#ffffff", // สีเมื่อเลือก option
      color: state.isSelected ? "#ffffff" : "#333333", // สีตัวอักษรเมื่อเลือก
      padding: "0.5rem", // ขนาด padding ของแต่ละ option
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // สีของ placeholder
    }),
    container: (provided) => ({
      ...provided,
      width: "100%",
    }),
  };
  return (
    <>
      {isMounted && (
        <div className="">
          <Header />
          <hr />
          <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
            <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
              <Menu />
            </div>
            <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
              <div className="flex flex-col">
                <div
                  className="mb-4 bg-white rounded-md border
        border-gray-400 shadow-xl p-8 w-full "
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                      <div className="flex justify-center items-center h-full w-full">
                        <img
                          src={dataUser.Imgurl || "/default-avatar.png"}
                          alt="profile"
                          className="w-24 h-24 md:w-[12rem] md:h-[12rem] rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-8 mt-8 md:mt-0">
                      <div className="flex flex-col md:flex-row gap-x-4">
                        <div className="flex-1 mb-4 md:mb-0">
                          <label
                            htmlFor="fullname"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            ชื่อ
                          </label>
                          <input
                            type="text"
                            name="fullname"
                            id="fullname"
                            className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            placeholder="กรุณากรอกชื่อ"
                            readOnly
                            value={dataUser.fullname || ""}
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="nameStrategic"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            ตำแหน่ง
                          </label>
                          <input
                            type="text"
                            name="nameStrategic"
                            id="nameStrategic"
                            className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            placeholder="กรุณากรอกชื่อตำแหน่ง"
                            readOnly
                            value={dataUser.position || ""}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-x-4 mt-4">
                        <div className="flex-1  mb-4 md:mb-0">
                          <label
                            htmlFor="nameStrategic"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            จำนวนโครงการที่รับผิดชอบ
                          </label>
                          <input
                            type="text"
                            name="nameStrategic"
                            id="nameStrategic"
                            className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            placeholder="จำนวนโครงการที่รับผิดชอบ"
                            readOnly
                            value={""}
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="nameStrategic"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            จำนวนกิจกรรมที่รับผิดชอบ
                          </label>
                          <input
                            type="text"
                            name="nameStrategic"
                            id="nameStrategic"
                            className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            placeholder="จำนวนกิจกรรมที่รับผิดชอบ"
                            readOnly
                            value={""}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-x-4 mt-4">
                        <div className="flex-1  mb-4 md:mb-0">
                          <label
                            htmlFor="nameStrategic"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            จำนวน OKR ที่รับผิดชอบ
                          </label>
                          <input
                            type="text"
                            name="nameStrategic"
                            id="nameStrategic"
                            className="bg-gray-0 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            placeholder="จำนวน OKR ที่รับผิดชอบ"
                            readOnly
                            value={""}
                          />
                        </div>
                        <div className="flex-1">
                          <label
                            htmlFor="nameStrategic"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            ปีงบประมาณ
                          </label>
                          <Select
                            value={yearOptions.find(
                              (option) => option.value === year
                            )}
                            onChange={(e) => {
                              console.log("Selected Value:", e.value);
                              setyear(e.value);
                            }}
                            options={yearOptions} // ตัวเลือกทั้งหมด
                            styles={customStyles}
                            className="text-sm"
                            placeholder="กรุณาเลือกยุทธศาสตร์" // ข้อความ placeholder
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-8 gap-4">
                    <div className="col-span-8 md:col-span-8 xl:col-span-4 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <div className="text-center my-4">
                        สถานะการดำเนินงานโครงการจำแนกตามหลักสูตร/หน่วยงาน
                      </div>
                      <ReactApexChart
                        options={options}
                        series={series}
                        type="bar"
                        height={350}
                      />
                    </div>

                    <div className="col-span-8 md:col-span-8 xl:col-span-4 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <div className="text-center my-4">
                        จำนวนงบประมาณที่ใช้จริงคิดเป็นเปอร์เซ็นต์จำแนกตามประเด็นยุทธศาสตร์
                      </div>
                      <div className="w-full max-w-full">
                        <ReactApexChart
                          options={state.options}
                          series={state.series}
                          type="pie"
                          height={350}
                          width="100%" // ใช้แบบ string เพื่อให้ responsive
                        />
                      </div>
                    </div>

                    <div className="col-span-8  bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <h5 className="card-title">
                        รายละเอียดโครงการที่รับผิดชอบ
                      </h5>
                      <div style={{ width: "100%" }}>
                        <DatatableProject year_id={year} />
                      </div>
                    </div>
                    <div className="col-span-8  bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <h5 className="card-title">
                        รายละเอียดกิจกรรมที่รับผิดชอบ
                      </h5>
                      <div style={{ width: "100%" }}>
                        <DatatableActivity year_id={year} />
                      </div>
                    </div>
                    <div className="col-span-8  bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <h5 className="card-title">
                        รายละเอียด OKR ที่รับผิดชอบ
                      </h5>
                      <div style={{ width: "100%" }}>
                        <DatatableUser />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>{/* <DatatableStrig /> */}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
