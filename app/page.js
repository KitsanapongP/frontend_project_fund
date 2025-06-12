"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import Menu from "./admin/component/nav_admin";
import DatatableStrig from "./admin/component/strategic";
import { GetLogin } from "./fetch_api/fetch_api_admin";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

export default function Home() {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handlelogin = async () => {
    try {
      console.log("email : ", email);
      console.log("password : ", password);
      if (!email || !password) {
        Swal.fire({
          title: "กรุณากรอกข้อมูลให้ครบถ้วน",
          text: "กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        return;
      }
      const res = await GetLogin(email, password);
      // console.log(res);
      if (res.token) {
        console.log(res.token);
        Cookies.set("token", res.token, { expires: 1 });
        Cookies.set("fullname", res.fullname, { expires: 1 });
        Cookies.set("id", res.id, { expires: 1 });
        Cookies.set("role", res.role, { expires: 1 });
        Cookies.set("urlImg", res.img, { expires: 1 });
        // Cookies.set("role", "admin", { expires: 1 });
        Swal.fire({
          title: "เข้าสู่ระบบสำเร็จ",
          text: "ยินดีต้อนรับ",
          icon: "success",
          confirmButtonText: "ตกลง",
        }).then(() => {
          if (res.role == 0) {
            window.location.href = "/admin";
          }else if (res.role == 2) {
            window.location.href = "/superadmin";
          } else {
            window.location.href = "/user";
          }
        });
      } else {
        Swal.fire({
          title: "ข้อมูลไม่ถูกต้อง",
          text: "กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "ข้อมูลไม่ถูกต้อง",
        text: "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };
  useEffect(() => {
    const token = Cookies.get("token");
    // console.log("token : ", token);
    if (token) {
      window.location.href = "/admin/strategic";
    }
  }, []);
  return (
    <>
      <div className="flex justify-center items-center min-h-screen bg-gray-300  ">
        <div className="w-120 h-160 bg-white rounded-2xl">
          <div className="flex flex-col mt-20 items-center ">
            <div>
              <img src="/image_icon/iconcpkku.png" className="w-70" alt="" />
            </div>
            <div className="text-3xl mt-6 font-bold">เข้าสู่ระบบ</div>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // ป้องกัน refresh หน้า
                handlelogin();
              }}
              className="flex flex-col mt-20 items-center"
            >
              <div className="mb-4">
                <label className="block mb-1 text-lg font-medium">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  className="bg-gray-50 border border-gray-300
               text-gray-900 rounded-lg w-[360px]  sm:w-[400px] p-1.5"
                  onChange={(e) => setemail(e.target.value)}
                  placeholder="อีเมล"
                  id=""
                />
              </div>
              <div>
                {" "}
                <label className="block mb-1 text-lg font-medium">
                  รหัสผ่าน
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="bg-gray-50 border border-gray-300
                   text-gray-900 rounded-lg w-[360px]  sm:w-[400px]  p-2 pr-10"
                    placeholder="รหัสผ่าน"
                    onChange={(e) => setpassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      padding: "0.25rem",
                      fontSize: "1.25rem",
                      color: "gray",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>
              <div className="mt-12">
                <button
                  className="text-white bg-gradient-to-br from-purple-600 to-blue-500 
                w-[360px]  sm:w-[400px]   py-2.5 rounded-xl  text-center 
                hover:bg-gradient-to-bl  
                "
                  onClick={handlelogin}
                >
                  เข้าสู่ระบบ
                </button>
                {/* <Link
                href="/admin/strategic"
                className="text-white bg-gradient-to-br from-purple-600 to-blue-500 
                px-39 py-2.5 rounded-xl  text-center
                hover:bg-gradient-to-bl 
                "
              >
                เข้าสู่ระบบ
              </Link> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
