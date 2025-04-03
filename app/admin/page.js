import Menu from "./component/nav";
import Header from "./component/header";

export default function Dashboard() {
  return (
    <>
      <div className="">
        <Header />
        <hr />
        <div className="grid grid-cols-10 gap-4 w-full min-h-screen">
          <div className="bg-gray-100 col-span-2 xl:col-span-2 hidden md:block md:col-span-3 pt-4 ps-3">
            <Menu />
          </div>
          <div className="col-span-10 xl:col-span-8  md:col-span-7  mt-5 md:mt-3 ">
            <div className="flex flex-row items-center">
              <div className="text-lg md:text-2xl me-3 ms-4">
                จัดการยุทธศาสตร์ประจำปี พ.ศ.
              </div>
              <select
                id="year"
                name="year"
                value={Year.year_id}
                onChange={(selectoptin) => {
                  setYear({
                    ...Year,
                    year_id: selectoptin?.value ?? null,
                  });
                }}
                className="block rounded-md p-2 bg-gray-100 border-black shadow-sm hover:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">กรุณาเลือกปี</option>
                {yearOptions.map((data, index) => (
                  <option key={index} value={data.label}>
                    {data.label}
                  </option>
                ))}
                {/* <option value="2567">2567</option>
                        <option value="2566">2566</option> */}
              </select>
            </div>
            <div>
              {/* <DatatableStrig /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
