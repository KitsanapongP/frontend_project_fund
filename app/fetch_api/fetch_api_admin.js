"use server";
let api = "http://127.0.0.1:8000";
import axios from "axios";

// import DatatableStrig from "../component/strig";

export async function GetDatayear(token) {
  // console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/year`, {
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDatastrategicYear(token, year_id) {
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/yearstrategic`,
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDatastrategic(token) {
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/strategic`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `application/json`, // ส่ง Token ผ่าน Header
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactionplan(token) {
  // console.log(id_strategic);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/actionplan`, {
      // params: {
      //   id_strategic: id_strategic,
      // },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}
export async function GetDataactionplanByidstrategic(token, id_strategic) {
  console.log(id_strategic);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/actionplanbyidstrategic`,
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataproject(token) {
  // console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/project`, {
      // params: {
      //   id_actionplan: id_actionplan,
      // },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataprojectByidaction(token, id_actionplan) {
  console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/projectbyidactionplan`,
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactivity(token, id_project) {
  console.log(id_project);
  try {
    console.log("token : ", token);
    const response = await axios.get(`${api}/api/v1/admin/activity`, {
      params: {
        id_project: id_project,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

export async function GetDataactionplanByidproject(token, id_project) {
  console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activitybyidproject`,
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


export async function GetDataactivitydetailByidactivity(token, id_activity) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/activitydetailbyidactivity`,
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}


export async function UpdatestatusStrategic(token, id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/updatestatusstrategic`,
      { id_strategic: id },
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

export async function UpdatestatusActionplan(token, id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/updatestatusactionplan`,
      { id_actionplan: id },
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

export async function UpdatestatusProject(token, id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/updatestatusproject`,
      { project_id: id },
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

export async function UpdatestatusActivity(token, id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/updatestatusactivity`,
      { activity_id: id },
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

export async function DeleteStrategic(token, id) {
  // console.log(id_project);
  try {
    // console.log("token : ", token);
    const response = await axios.delete(`${api}/api/v1/admin/deletestrategic`, {
      data: { id_strategic: id },
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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}

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
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}
