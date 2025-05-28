"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Menu from "../component/nav_admin";
import Header from "../component/header";
import DatatableStrig from "../component/strategic";
import {
  ModalAddStrategic,
  ModalAddStrategicNew,
} from "./component/modal_strategic";
import { GetDatayear } from "../../fetch_api/fetch_api_admin";
import Aos from "aos";

export default function HomeStrategic() {
  
  const [yearOptions, setyearOptions] = useState([
    // { value: 1, label: "2568" },
    // { value: 2, label: "2567" },
    // { value: 3, label: "2566" },
  ]);

  const [isOpenModalAdd, setIsOpenModalAdd] = useState(false);
  const [isOpenModalAddNew, setIsOpenModalAddNew] = useState(false);
  const [strategicName, setStrategicName] = useState("");
  const [Year, setYear] = useState({
    year_id: null,
  });

  useEffect(() => {
    Aos.init({
      duration: 300,
      once: false,
    });
  }, []);

  const [type, settype] = useState(null);
  const [data, setdata] = useState({
    name: null,
    number: null,
    budget: null,
    id_year: null,
  });
  const [totalRows, setTotalRows] = useState(0);
  const toggleModalAdd = () => {
    settype(1);
    setdata((prev) => ({
      ...prev,
      name: "",
      number: "S" + (totalRows + 1),
      budget: null,
      id_year: Year.year_id,
    }));
    setIsOpenModalAdd(!isOpenModalAdd); // เปลี่ยนสถานะของ modal
  };

  const toggleModalEdit = (newname, id, number, budget, id_year) => {
    settype(2);
    console.log(newname);
    setdata((prev) => ({
      ...prev,
      strategic_id: id,
      name: newname,
      number: number,
      budget: budget,
      id_year: id_year,
    }));
    toggleModalAddNew();
  };

  const toggleModalAddNew = () => {
    setIsOpenModalAddNew(!isOpenModalAddNew); // เปลี่ยนสถานะของ modal
  };
  useEffect(() => {
    // กด esc แล้วปืด
    console.log(isOpenModalAddNew);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isOpenModalAdd) {
          toggleModalAdd(); // ปิด Modal ถ้าเปิดอยู่
        }
        if (isOpenModalAddNew) {
          toggleModalAddNew(); // ปิด Modal ถ้าเปิดอยู่
        }
      }
    };
    // handleKeyDown คือฟังก์ชันที่ฟัง event การกดปุ่มบนคีย์บอร์ด (เช่น Escape)
    document.addEventListener("keydown", handleKeyDown);

    // ใช้ลบ event listener เพื่อป้องกันปัญหา memory leak หรือ event ถูกเรียกซ้ำซ้อน
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpenModalAdd, isOpenModalAddNew]);

  const handleModalSelect = (type) => {
    toggleModalAdd();
    toggleModalAddNew();
  };

  const handleStrategicNameChange = (newStrategicName) => {
    setStrategicName(newStrategicName);
    // console.log("ชื่อยุทธศาสตร์ที่เลือก:", newStrategicName); // ทำการจัดการข้อมูลที่ได้รับ
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const token = Cookies.get("token");
        // console.log("token : ", token);
        const res = await GetDatayear(token);
        // console.log("year : ", res.data);
        setyearOptions(res.data);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();
  }, []);

 useEffect(() => {
  if (yearOptions.length > 0 && !Year.year_id) {
    const { year_id, year } = yearOptions[0]; // หรือ .value, .label ถ้าเป็น react-select
    setYear((prev) => ({
      ...prev,
      year_id,
      year_label:year,
    }));
    console.log(year)
  }
  
}, [yearOptions]);

  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-12  gap-0 w-full min-h-screen mt-20">
          <div className="bg-gray-100  xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-12 xl:col-span-10  md:col-span-9 mt-5 ms-4 md:mt-3 me-4 md:me-6">
            <div className="flex flex-row justify-between items-center mb-4 flex-wrap md:flex-nowrap gap-4">
              <div className="flex flex-row items-center gap-3">
                <div className="text-lg md:text-2xl">
                  จัดการยุทธศาสตร์ประจำปี พ.ศ.
                </div>
                <select
                  id="year"
                  name="year"
                  value={Year.year_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const label = e.target.options[e.target.selectedIndex].text;
                    console.log(label)
                    setYear({
                      ...Year,
                      year_id: value,
                      year_label: label,
                    });
                  }}
                  className="block rounded-md px-4 py-2 bg-gray-100 border border-gray-300 shadow-sm hover:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                  style={{
                    appearance: "none",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "0.75em",
                    paddingRight: "3rem",
                  }}
                >
                  {yearOptions.map((data, index) => (
                    <option key={index} value={data.year_id}>
                      {data.year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                data-modal-target="popup-modal"
                data-modal-toggle="popup-modal"
                onClick={toggleModalAdd}
                className="w-24 py-2 px-3 bg-blue-400 text-white rounded-lg hover:bg-blue-700"
              >
                เพิ่มข้อมูล
              </button>
            </div>
            <div>
              {Year.year_id !== Year.year_label !== null && (
                <DatatableStrig
                  year_id={Year.year_id}
                  year={Year.year_label}
                  onTotalChange={setTotalRows}
                  onEdit={toggleModalEdit}
                />
              )}{" "}
            </div>
          </div>
        </div>
      </div>
      <ModalAddStrategic
        isOpen={isOpenModalAdd}
        onClose={() => setIsOpenModalAdd(false)}
        onSelect={handleModalSelect}
      />
      {yearOptions && (
        <ModalAddStrategicNew
          isOpen={isOpenModalAddNew}
          yearall={yearOptions}
          type={type}
          data={data}
          onStrategicNameChange={handleStrategicNameChange}
          onClose={() => setIsOpenModalAddNew(false)}
        />
      )}
    </>
  );
}
