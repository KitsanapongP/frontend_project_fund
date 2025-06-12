"use server";
let api = "http://127.0.0.1:8000";
import axios from "axios";

// import DatatableStrig from "../component/strig";
export async function GetLogin(email, password) {
  // console.log(id_strategic.data)
  try {
    const response = await axios.post(
      `${api}/api/login-admin`,
      { email, password },
      {
        headers: {
          "Content-Type": `application/json`, // ส่ง Token ผ่าน Header
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataprojectUserByYear(token, id_year, page, per_page) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/projectuserallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactionplanByidproject(
  token,
  id_project,
  page,
  per_page
) {
  console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activitybyidproject?page=${page}&per_page=${per_page}`,
      { id_project },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactivitydetailByidactivity(
  token,
  id_activity,
  page,
  per_page
) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activitydetailbyidactivityadmin?page=${page}&per_page=${per_page}`,
      { id_activity },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function AddDataActivitydetail(token, dataAddsend) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activitydetail`,
      {
        detail: dataAddsend.detail, // ใช้ชื่อแทน detail
        price: dataAddsend.total_price, // สมมุติว่า budget คือต้นทุน
        start_date: dataAddsend.start_date, // ต้องมี field นี้ใน dataAddsend
        end_date: dataAddsend.end_date,
        station: dataAddsend.station,
        report_data: dataAddsend.report_data,
        id_employee: dataAddsend.id_employee,
        id_activity: dataAddsend.id_activity,
        // url: dataAddsend.url,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function EditDataActivitydetail(token, dataAddsend) {
  // console.log(id_project);
  try {
    console.log("token : ", dataAddsend);
    const response = await axios.put(
      `${api}/api/v1/admin/activitydetail/${dataAddsend.id}`,
      {
        detail: dataAddsend.detail, // ใช้ชื่อแทน detail
        price: dataAddsend.total_price, // สมมุติว่า budget คือต้นทุน
        start_date: dataAddsend.start_date, // ต้องมี field นี้ใน dataAddsend
        end_date: dataAddsend.end_date,
        station: dataAddsend.station,
        report_data: dataAddsend.report_data,
        id_employee: dataAddsend.id_employee,
        id_activity: dataAddsend.id_activity,
        // url: dataAddsend.url,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);

    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error.response.data?.message);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message;
  }
}

export async function GetDatayear(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/year`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactivityUserByYear(
  token,
  id_year,
  page,
  per_page
) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activityuserallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataprincipleUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/principle`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDatadepartmentUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/department`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDatastrategicForAdd(token, year_id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/strategicforadd`,
      { year_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataOkrUse(token,year_id) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.post(`${api}/api/v1/admin/okr`,{
      year_id 
    } ,{
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDatateacherUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/userteacher`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataemployeeUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/useremployee`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataunitUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/unit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDatastyleUse(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/style`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}



export async function GetDatastrategicYear(token, year_id, page, per_page) {
  try {
    // `${api}/api/v1/admin/actionplanallbyidyear?page=${page}&per_page=${per_page}`,

    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/yearstrategic?page=${page}&per_page=${per_page}`,
      {
        year_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDataactionplanByidstrategic(
  token,
  id_strategic,
  page,
  per_page
) {
  console.log(id_strategic);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/actionplanbyidstrategic?page=${page}&per_page=${per_page}`,
      { id_strategic },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDataprojectByidaction(
  token,
  id_actionplan,
  page,
  per_page
) {
  console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/projectbyidactionplan?page=${page}&per_page=${per_page}`,
      {
        id_actionplan,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDataactionplanByYear(
  token,
  id_year,
  page = 1,
  per_page = 10
) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/actionplanallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function GetDataprojectByYear(
  token,
  id_year,
  page = 1,
  per_page = 10
) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", page);
    const response = await axios.post(
      `${api}/api/v1/admin/projectallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactivityByYear(
  token,
  id_year,
  page = 1,
  per_page = 10
) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", page);
    const response = await axios.post(
      `${api}/api/v1/admin/activityallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}