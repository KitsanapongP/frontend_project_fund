"use server";
let api = "http://127.0.0.1:8000";
import axios from "axios";

export async function GetDataprojectUserByYear(token, id_year, page, per_page) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/user/projectuserallbyidyear?page=${page}&per_page=${per_page}`,
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
      `${api}/api/v1/user/activitybyidproject?page=${page}&per_page=${per_page}`,
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
      `${api}/api/v1/user/activitydetailbyidactivity?page=${page}&per_page=${per_page}`,
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
      `${api}/api/v1/user/activitydetail`,
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
      `${api}/api/v1/user/activitydetail/${dataAddsend.id}`,
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
      `${api}/api/v1/user/year`,
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
      `${api}/api/v1/user/activityuserallbyidyear?page=${page}&per_page=${per_page}`,
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
    const response = await axios.get(`${api}/api/v1/user/principle`, {
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
    const response = await axios.get(`${api}/api/v1/user/department`, {
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
      `${api}/api/v1/user/strategicforadd`,
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
    const response = await axios.post(`${api}/api/v1/user/okr`,{
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
    const response = await axios.get(`${api}/api/v1/user/userteacher`, {
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
    const response = await axios.get(`${api}/api/v1/user/useremployee`, {
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
    const response = await axios.get(`${api}/api/v1/user/unit`, {
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
    const response = await axios.get(`${api}/api/v1/user/style`, {
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