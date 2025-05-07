import { HiMenu } from "react-icons/hi";
import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import Menu from "./nav_admin";
import Aos from "aos";
import Cookies from "js-cookie";
import "aos/dist/aos.css";
export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [fullname, setFullname] = useState(false);
  useEffect(() => {
    Aos.init({
      duration: 250,
      once: false,
    });
    const fullname = Cookies.get("fullname");
    setFullname(fullname);
  }, []);
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-50 shadow">
        <div className="flex h-20 w-full  items-center justify-between">
          <div className="">
            <img
              src="/image_icon/iconcpkku.png"
              className="w-40 ms-4 md:ms-8"
              alt=""
            />
          </div>

          <div className="flex flex-row items-center">
            <div className="hidden md:block md:me-8">{fullname}</div>
            <button
              type="button"
              data-collapse-toggle="navbar-default"
              className={`${
                !isOpen ? "block" : "hidden"
              } inline-flex items-center justify-center me-4 ms-3 p-2 w-10 h-10 text-sm text-gray-500  rounded-lg
          md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200
              `}
              onClick={() => setIsOpen((prev) => !prev)}
              aria-controls="navbar-default"
              aria-expanded="false"
            >
              <span className="sr-only"> Open user menu </span>
              {/* <div>asdasdasd</div> */}
              <HiMenu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {isOpen && (
            <div
              className="fixed inset-0 bg-gray-200/50 z-40 "
              data-aos="fade-right"
              onClick={() => setIsOpen(false)} // กดนอกเมนู = ปิด
            >
              <div
                className="absolute top-0 pt-5  border-s-1  right-0 h-screen z-50 w-64 bg-white  shadow p-4"
                onClick={(e) => e.stopPropagation()} // กันไม่ให้คลิกที่เมนูแล้วหลุด
                data-aos="fade-left"
              >
                <div className="flex justify-end mb-3">
                  <button onClick={() => setIsOpen(false)}>
                    <RxCross2 className="w-7 h-7 text-gray-600 hover:text-red-500" />
                  </button>
                </div>
                <Menu />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
