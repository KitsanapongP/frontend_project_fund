'use client'

import Menu from "./component/nav";
import { useState, useEffect } from "react";
import Header from "./component/header";
import dynamic from "next/dynamic";
import Select from "react-select";
// ต้องใช้แบบนี้เท่านั้น
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export default function Dashboard() {
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

  const [optionsStrategic, setoptionsStrategic] = useState([
    { value: "S1", label: "S1 : ยุทธศาสตร์ด้านการจัดการศึกษา" },
    { value: "S2", label: "S2 : ยุทธศาสตร์ด้านการวิจัย" },
    {
      value: "S3",
      label: "S3 : ยุทธศาสตร์ด้านการบริการวิชาการเพื่อสร้างประโยชน์ให้สังคม",
    },
  ]);

  const [dataAddNewProject, setdataAddNewProject] = useState({
    strategic: null,
  });

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#f9fafb", // สีพื้นหลังที่ต้องการ
      borderColor: "#d1d5db", // สีของขอบ
      padding: "0.125rem", // ขนาด padding
      borderRadius: "0.375rem", // ขอบมุมโค้ง
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff", // สีพื้นหลังของ dropdown
      borderColor: "#d1d5db",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#1E90FF" : "#ffffff", // สีเมื่อเลือก option
      color: state.isSelected ? "#ffffff" : "#333333", // สีตัวอักษรเมื่อเลือก
      padding: "0.5rem", // ขนาด padding ของแต่ละ option
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // สีของ placeholder
    }),
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // ตั้งค่าเป็น true เมื่อคอมโพเนนต์ถูก mount แล้วบน client
  }, []);


  
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
                <div className="grid grid-cols-12 gap-4 w-full mb-8">
                  <div className="col-span-12 md:col-span-6 md:ms-0  xl:col-span-3">
                    {" "}
                    <div
                      className="grid grid-cols-6 p-6 bg-white rounded-xl border
        border-gray-400 shadow-xl "
                    >
                      <div className="col-span-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          icon
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="flex flex-col items-start">
                          <div className="text-md font-medium">
                            โครงการที่ดำเนินการ
                          </div>
                          <div className="text-md font-semibold">
                            4 / 20 โครงการ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6 md:ms-0  xl:col-span-3">
                    {" "}
                    <div
                      className="grid grid-cols-6 p-6 bg-white rounded-xl border
        border-gray-400 shadow-xl "
                    >
                      <div className="col-span-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          icon
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="flex flex-col items-start">
                          <div className="text-md font-medium">
                            กิจกรรมที่ดำเนินการ
                          </div>
                          <div className="text-md font-semibold">
                            10 / 20 กิจกรรม
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6 md:ms-0  xl:col-span-3">
                    {" "}
                    <div
                      className="grid grid-cols-6 p-6 bg-white rounded-xl border
        border-gray-400 shadow-xl "
                    >
                      <div className="col-span-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          icon
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="flex flex-col items-start">
                          <div className="text-md font-medium">
                            งบประมาณที่ใช้ไป
                          </div>
                          <div className="text-md font-semibold">
                            10,000 บาท
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6 md:ms-0  xl:col-span-3">
                    {" "}
                    <div
                      className="grid grid-cols-6 p-6 bg-white rounded-xl border
        border-gray-400 shadow-xl "
                    >
                      <div className="col-span-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          icon
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="flex flex-col items-start">
                          <div className="text-md font-medium">
                            งบประมาณคงเหลือ
                          </div>
                          <div className="text-md font-semibold">2,000 บาท</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 mb-8">
                  <hr className="text-gray-300" />
                </div>
                <div
                  className="mb-4 bg-white rounded-md border
        border-gray-400 shadow-xl p-3 w-full"
                >
                  <div className="flex flex-cols">
                    <div>
                      <label
                        htmlFor="deparment"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        หน่วยงานรับผิดชอบ
                      </label>
                      <Select
                        id="strategic"
                        value={optionsStrategic.find(
                          (option) =>
                            option.value === dataAddNewProject.strategic
                        )}
                        onChange={(e) => {
                          setdataAddNewProject({
                            ...dataAddNewProject,
                            strategic: e.value,
                          });
                        }}
                        options={optionsStrategic}
                        styles={customStyles}
                        className="text-sm shadow-md"
                        placeholder="กรุณาเลือกปีงบประมาณ"
                        instanceId="strategic-select" // Add this line to fix duplicate IDs
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-8 gap-4">
                    <div className="col-span-8 md:col-span-8 xl:col-span-5 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
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

                    <div className="col-span-8 md:col-span-8 xl:col-span-3 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
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

                    <div className="col-span-8 md:col-span-8 xl:col-span-5 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <div className="text-center my-4">
                        สถานะการดำเนินงานกิจกรรม จำแนกตามหลักสูตร/หน่วยงาน
                      </div>
                      <ReactApexChart
                        options={options}
                        series={series}
                        type="bar"
                        height={350}
                      />
                    </div>
                    <div className="col-span-8 md:col-span-8 xl:col-span-3 bg-white rounded-xl border border-gray-400 shadow-xl p-3">
                      <div className="text-center my-4">
                        จำนวนโครงการกิจกรรมดำเนินการแล้วเสร็จจำแนกตามประเด็นยุทธศาสตร์
                      </div>
                      <div className="w-full max-w-full">
                        <ReactApexChart
                          options={state.options}
                          series={state.series}
                          type="pie"
                          height={300}
                          width="100%" // ใช้แบบ string เพื่อให้ responsive
                        />
                      </div>
                    </div>

                    <div
                      className="col-span-8 bg-white rounded-xl border border-gray-400 shadow-xl p-3"
                    >
                      <h5 className="card-title">ยอดแต่ละเดือน</h5>
                      <div style={{ width: "100%", height: "300px" }}>
                        <ReactApexChart
                          options={options_line}
                          series={series}
                          type="line"
                          height={300}
                        />
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