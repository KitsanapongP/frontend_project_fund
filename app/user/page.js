'use client'

import Menu from "./component/nav";
import { useState, useEffect } from "react";
import Header from "./component/header";
import dynamic from "next/dynamic";
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
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
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

  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-10 gap-4 w-full h-screen  mt-20">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3 ">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  ms-8 md:ms-0 md:col-span-7  mt-5 md:mt-3  me-8">
            <div className="flex flex-col">
              <div className="grid grid-cols-12 gap-4 w-full mb-8">
                <div className="col-span-12 sm:col-span-6 md:col-span-6 md:ms-0  xl:col-span-3">
                  <div className="grid grid-cols-6 bg-gray-200 rounded-2xl p-6">
                    <div className="col-span-2">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        icon
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="flex flex-col items-start">
                        <div className=" font-medium">แผนยุทธศาสตร์ทั้งหมด</div>
                        <div className="text-xl font-semibold">45 ฉบับ</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-6 md:ms-0  xl:col-span-3">
                  {" "}
                  <div className="grid grid-cols-6 bg-gray-200 rounded-2xl p-6">
                    <div className="col-span-2">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        icon
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="flex flex-col items-start">
                        <div className="text-lg font-medium">
                          แผนยุทธศาสตร์ทั้งหมด
                        </div>
                        <div className="text-xl font-semibold">45 ฉบับ</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-6 md:ms-0  xl:col-span-3">
                  {" "}
                  <div className="grid grid-cols-6 bg-gray-200 rounded-2xl p-6">
                    <div className="col-span-2">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        icon
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="flex flex-col items-start">
                        <div className="text-lg font-medium">
                          แผนยุทธศาสตร์ทั้งหมด
                        </div>
                        <div className="text-xl font-semibold">45 ฉบับ</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-6 md:ms-0  xl:col-span-3">
                  {" "}
                  <div className="grid grid-cols-6 bg-gray-200 rounded-2xl p-6">
                    <div className="col-span-2">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        icon
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="flex flex-col items-start">
                        <div className="text-lg font-medium">
                          แผนยุทธศาสตร์ทั้งหมด
                        </div>
                        <div className="text-xl font-semibold">45 ฉบับ</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-8 gap-8">
                  <div className="col-span-8 md:col-span-8 xl:col-span-5">
                    <div>แผนยุทธศาสตร์</div>
                    <ReactApexChart
                      options={options}
                      series={series}
                      type="bar"
                      height={350}
                    />
                  </div>
                  <div className="col-span-3 md:col-span-8 xl:col-span-3">
                    <div>แผนยุทธศาสตร์</div>
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
                  <div className="col-span-8">
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
    </>
  );
}
