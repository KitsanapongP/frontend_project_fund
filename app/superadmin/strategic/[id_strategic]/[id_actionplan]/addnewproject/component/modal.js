import { useState, useEffect } from "react";
// In component/modal.js
import Select from "react-select";

import _ from "lodash";
import Swal from "sweetalert2";
export function ModalAddOkrNew({
  isOpen,
  onClose,
  type,
  okr,
  oleOkr,
  onSelectOkr,
}) {
  if (!isOpen) return null;

  // const [actionplanName, setActionplanName] = useState("");
  const [selectedStrategic, setSelectedStrategic] = useState(null);
  const [Oldactionplan, setoldactionplan] = useState(oleOkr);

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

  useEffect(() => {
    console.log(selectedStrategic);
  }, [selectedStrategic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(type);

    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: type
        ? `ยืนยันการบันทึกข้อมูล : ${selectedStrategic.label}`
        : `ยืนยันการแก้ไขข้อมูล : ${selectedStrategic.label}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", position);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(position);

        if (_.isEqual(Oldactionplan, selectedStrategic)) {
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถแก้ไข OKR เป็นค่าเดิมได้",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        if (selectedStrategic) {
          onSelectOkr(selectedStrategic);
        }

        onClose();

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };

  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-xl max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 1 ? "เพิ่ม OKR ใหม่" : "แก้ไข OKR "}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  OKR
                </label>
                <Select
                  value={selectedStrategic}
                  onChange={(e) => setSelectedStrategic(e)}
                  options={okr} // ตัวเลือกทั้งหมด
                  styles={customStyles}
                  className="text-sm"
                  placeholder="กรุณาเลือก OKR " // ข้อความ placeholder
                />
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="submit"
                  className="text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={onClose}
                  className="text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalAddObjectiveNew({
  isOpen,
  onClose,
  type,
  okr,
  oleOkr,
  onSelectOkr,
}) {
  if (!isOpen) return null;

  // const [actionplanName, setActionplanName] = useState("");
  const [selectedStrategic, setSelectedStrategic] = useState("");
  const [Oldactionplan, setoldactionplan] = useState(oleOkr);

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

  useEffect(() => {
    console.log(selectedStrategic);
  }, [selectedStrategic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(type);
    if (selectedStrategic.trim() == "") {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
      return;
    }
    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: type
        ? `ยืนยันการบันทึกข้อมูล : ${selectedStrategic}`
        : `ยืนยันการแก้ไขข้อมูล : ${selectedStrategic}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", position);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(position);

        // if (_.isEqual(Oldactionplan, selectedStrategic)) {
        //   Swal.fire({
        //     title: "เกิดข้อผิดพลาด",
        //     text: "ไม่สามารถแก้ไข OKR เป็นค่าเดิมได้",
        //     icon: "error",
        //     confirmButtonText: "ตกลง",
        //   });
        //   return;
        // }
        if (selectedStrategic.trim() !== "") {
          onSelectOkr(selectedStrategic);
        }

        onClose();

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };

  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-xl max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 1 ? "เพิ่มวัตถุประสงค์ใหม่" : "แก้ไขวัตถุประสงค์"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  วัตถุประสงค์
                </label>
                <input
                  type="text"
                  value={selectedStrategic}
                  onChange={(e) => setSelectedStrategic(e.target.value)}
                  placeholder="กรุณากรอกชื่อวัตถุประสงค์"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="submit"
                  className="text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={onClose}
                  className="text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalAddUserNew({
  isOpen,
  onClose,
  type,
  user,
  olduser,
  onSelectuser,
}) {
  if (!isOpen) return null;

  // const [actionplanName, setActionplanName] = useState("");
  const [selectedStrategic, setSelectedStrategic] = useState(null);
  const [Oldactionplan, setoldactionplan] = useState(olduser);

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

  useEffect(() => {
    console.log(selectedStrategic);
  }, [selectedStrategic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(type);

    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: type
        ? `ยืนยันการบันทึกข้อมูล : ${selectedStrategic.label}`
        : `ยืนยันการแก้ไขข้อมูล : ${selectedStrategic.label}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", position);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(position);

        // if (_.isEqual(Oldactionplan, selectedStrategic)) {
        //   Swal.fire({
        //     title: "เกิดข้อผิดพลาด",
        //     text: "ไม่สามารถแก้ไข OKR เป็นค่าเดิมได้",
        //     icon: "error",
        //     confirmButtonText: "ตกลง",
        //   });
        //   return;
        // }
        if (selectedStrategic) {
          onSelectuser(selectedStrategic);
        }

        onClose();

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };

  return (
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-xl max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 1
                ? "เพิ่มผู้รับผิดชอบระดับปฏิบัติใหม่"
                : "เพิ่มผู้รับผิดชอบระดับนโยบาย / บริหาร ใหม่"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {type === 1
                    ? "ผู้รับผิดชอบระดับปฏิบัติ"
                    : "ผู้รับผิดชอบระดับนโยบาย / บริหาร  "}
                </label>
                <Select
                  value={selectedStrategic}
                  onChange={(e) => setSelectedStrategic(e)}
                  options={user} // ตัวเลือกทั้งหมด
                  getOptionLabel={(e) => `${e.label} ${e.position || ""}`} // label ที่โชว์
                  getOptionValue={(e) => e.value}
                  styles={customStyles}
                  className="text-sm"
                  placeholder={
                    type === 1
                      ? "กรุณาเลือกผู้รับผิดชอบระดับปฏิบัติ"
                      : "กรุณาเลือกผู้รับผิดชอบระดับนโยบาย / บริหาร  "
                  } // ข้อความ placeholder
                />
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="submit"
                  className="text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={onClose}
                  className="text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalAddindicatorNew({
  isOpen,
  onClose,
  type,
  indicator,
  unit,
  oldindicator,
  onSelectindicator,
}) {
  if (!isOpen) return null;

  // const [actionplanName, setActionplanName] = useState("");
  const [dataIndicator, setdataIndicator] = useState({
    indicator_name: null,
    unit_name: null,
    goal: null,
  });
  //   const [Oldactionplan, setoldactionplan] = useState(oleindicator);

  useEffect(() => {
    console.log(dataIndicator);
  }, [dataIndicator]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(type);
    const requiredFields = {
      indicator_name: "ตัวชี้วัด",
    //   unit_name: "หน่วยนับ",
      goal: "ค่าเป้าหมาย",
    };

    // Object.entries(requiredFields))  แปลงเป็น [[],[]]
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!dataIndicator[field] || dataIndicator[field].trim() === "") {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: `กรุณากรอกข้อมูลช่อง ${label} ให้ครบถ้วน`,
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        return;
      }
    }
    Swal.fire({
      title: type == 1 ? "ยืนยันการบันทึกข้อมูล ?" : "ยืนยันการแก้ไขข้อมูล ?",
      text: type
        ? `ยืนยันการบันทึกข้อมูล : ${dataIndicator.indicator_name}`
        : `ยืนยันการแก้ไขข้อมูล : ${dataIndicator.indicator_name}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        // console.log("Submitted Strategic Name: ", position);

        // เพิ่มหรือส่งข้อมูลกลับ
        // เช่น: onSave(position);

        // if (_.isEqual(Oldactionplan, selectedStrategic)) {
        //   Swal.fire({
        //     title: "เกิดข้อผิดพลาด",
        //     text: "ไม่สามารถแก้ไข OKR เป็นค่าเดิมได้",
        //     icon: "error",
        //     confirmButtonText: "ตกลง",
        //   });
        //   return;
        // }
        // if (dataIndicator.indicator_name.trim() !== "") {
        //   onSelectOkr(selectedStrategic);
        // }
        onSelectindicator(dataIndicator);
        onClose();

        // onClose(); // ปิด modal ถ้าต้องการ
      }
    });
  };

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
    <div
      id="popup-modal"
      tabIndex="-1"
      className="fixed top-0 left-0 w-full h-full bg-gray-500/60 bg-opacity-50 z-50 flex justify-center items-center"
    >
      <div
        data-aos="fade-down"
        className="relative p-4 w-full max-w-xl max-h-full"
      >
        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {type === 1
                ? "เพิ่มตัวชี้วัดและค่าเป้าหมายของโครงการ/กิจกรรมใหม่"
                : "แก้ไขตัวชี้วัดและค่าเป้าหมายของโครงการ/กิจกรรม"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="authentication-modal"
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ตัวชี้วัด
                </label>
                <input
                  type="text"
                  value={dataIndicator.indicator_name || ""}
                  onChange={(e) =>
                    setdataIndicator((prev) => ({
                      ...prev,
                      indicator_name: e.target.value,
                    }))
                  }
                  placeholder="กรุณากรอกชื่อตัวชี้วัด"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </div>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  หน่วยนับ
                </label>
                <Select
                  value={dataIndicator.unit_name}
                  onChange={(selectedOption) =>
                    setdataIndicator((prev) => ({
                      ...prev,
                      unit_name: selectedOption, // หรือ selectedOption.value ถ้าต้องการเก็บแค่ value
                    }))
                  }
                  options={unit}
                  getOptionLabel={(e) => e.label}
                  getOptionValue={(e) => e.value}
                  styles={customStyles}
                  className="text-sm"
                  placeholder="กรุณาเลือกหน่วยนับ"
                />
              </div>
              <div>
                <label
                  htmlFor="Strategic"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ค่าเป้าหมายของโครงการ/กิจกรรม
                </label>
                <input
                  type="number"
                  value={dataIndicator.goal || ""}
                  onChange={(e) =>
                    setdataIndicator((prev) => ({
                      ...prev,
                      goal: e.target.value,
                    }))
                  }
                  placeholder="กรุณากรอกค่าเป้าหมายของโครงการ/กิจกรรม"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button
                  type="submit"
                  className="text-white bg-green-600 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={onClose}
                  className="text-white bg-gray-600 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
