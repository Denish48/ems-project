import axios from "axios";
import { message } from "antd";

export default class Service {
  static Server_Base_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL
      : "https://eems.elsnerit.com/";
     // "http://localhost:8888"
  static API_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL + "/api"
      : `${this.Server_Base_URL}/api`;


  static API_Call_Counter = 0;
  static incre_API_Call_Counter = () => this.API_Call_Counter++;
  static decre_API_Call_Counter = () =>
  (this.API_Call_Counter =
    this.API_Call_Counter > 0 ? this.API_Call_Counter - 1 : 0);

  static error_message = "Something went wrong!";
  static error_message_key = "error_message_key";

  static message_containner = [];
  static add_message = (text) => {
    var index = this.message_containner.findIndex((x) => x === text);
    // here you can check specific property for an object whether it exist in your array or not
    if (index === -1) {
      this.message_containner.push(text);
    }
    return index;
  };
  static remove_message = (message) =>
  (this.message_containner = this.message_containner.filter(
    (m) => m !== message
  ));
  static messageError = (msg) => {
    const index = this.add_message(msg);
    if (index === -1) {
      message.error(msg).then(() => {
        this.remove_message(msg);
      });
    }
  };

  static messageInfo = (msg) => {
    const index = this.add_message(msg);
    if (index === -1) {
      message.info(msg).then(() => {
        this.remove_message(msg);
      });
    }
  };

  static postMethod = "POST";
  static getMethod = "GET";
  static putMethod = "PUT";
  static deleteMethod = "DELETE";
  static headers = {
    accept: "application/json",
    "content-type": "application/json",
  };

  //Auth Module
  static login = "/admin/login";
  static userById = "/admin/userById";
  static editAdmin = "/admin/editadminuserprofile";
  static refreshToken = "/auth/refreshToken";
  static forgotPassword = "/auth/forgotPassword";
  static resetPassword = "/auth/resetPassword";

  //icon & logo
  static editLogo_Icon = "/adminsettings/editAdminSetting";
  static customadminSetting = "/adminsettings/customadminSetting";
  static getAdminSettings = "/adminsettings/adminSetting";

  //previous Event
  static previousEvents = "/admin/event/previousEvents";
  static liveEvents = "/admin/event/liveEvents";

  static upcomingEvents = "/admin/event/upcomingEvents";

  //trainner module
  static trainnerList = "/host/trainnerList";
  //Elevate-forms -satisfaction
  static employeessurvey = "/admin/dashboard/employeessurvey"
  static employeesStatisfaction = "/admin/employeesStatisfaction"

  //department module
  static departmentList = "/department/departmentList";
  static departmentDropdownList = "/department/departmentDropdownList";
  static designationDropdownList = "/event/designationDropdownList";
  static departmentAdd = "/department/addDepartment";
  static departmentById = "/department/departmentById";
  static editDepartment = "/department/editDepartment";
  static deleteDepartment = "/department/deleteDepartment";
  //add admin
  static addAdminUser = "/admin/addAdminUser";
  static rolesDropdownList = "/roles/rolesDropdownList";
  static getAdminList = "/admin/adminuserlist"
  static adminSetting = "/adminsettings/adminSetting"

  //employeee
  static employees = "/employees/employeesList";
  static importUsers = "/importFile/importUsers";
  static addEmployees = "/employees/addEmployees";
  static employeebyId = "/employees/employeeById";
  static editEmployee = "/employees/editEmployee";
  static employeesDropdownList = "/employees/employeesDropdownList";
  static exportUsers = "/employees/exportUsers"
  static employeeAccountAction = "/employees/employeeAccountAction"
  static employeeView = "/admin/event/myScoreAttendedEvent"
  static birthdatelist = "/employees/birthdatelistAdmin";
  static addPostcardTemplete = "/postCardTemplete/addPostcardTemplete";
  static postCardTempleteList = "/postCardTemplete/postCardTempleteList";
  static deletePostcardTempleteById = "/postCardTemplete/deletePostcardTempleteById"
  static editPostcardTemplete = "/postCardTemplete/editPostcardTemplete"
  static addpostcard = "/postcard/addpostcard"
  static postcardlist = "/postcard/postcardlist"
  static previewtemplete = "/postcard/previewtemplete"
  static deletePostcardById = "/postcard/deletePostcardById"





  //exportEvents
  static exportEvents = "/admin/event/exportEvents"
  //notification
  static notificationList = "/admin/notificationList"
  static eventDropdownList = "/event/eventDropdownList"
  static customNotification = "/notification/customNotification"
  static deleteNotification = "/notification/deleteNotification";

  //participateUser 
  static participateUser = "/event/totalUser"
  //eventType module
  static eventsType = "/eventType/eventTypeList";
  static eventTypeAdd = "/eventType/addEventTypes";
  static eventTypeById = "/eventType/eventTypeById";
  static eventsTypeEdit = "/eventType/editEventType";
  static eventTypeDelete = "/eventType/deleteEventType";

  //event list
  static eventsList = "/admin/event/eventList";
  static eventAdd = "/event/addEvent";
  static eventById = "/event/eventById";
  static editEvent = "/event/editEvent";
  static saveEventNotification = "/event/saveEventNotification";
  static eventDelete = "/event/deleteEvent";
  static eventTypeDropdownList = "/eventType/eventTypeDropdownList";
  static eventClone = "/event/eventClone";
  static eventStatus = "/event/eventStatus";
  static getEventForm = "/elevateForms/getEventForm";
  static feedbackById = "/feedback/feedbackById";
  static saveEventForm = "/elevateForms/saveEventForm";

  static addsurvey = "/surveys/addsurvey"
  static editsurvey = "/surveys/editSurvey"
  static surveyList = "/surveys/surveyList";
  static surveyById = "/surveys/surveyById";
  static SurveyUsersList = "/surveys/SurveyUsersList";
  static surveyAnswersById = "/surveys/surveyAnswersById";

  //dashboard data
  static event_calander = "/admin/dashboard/event_calender";
  static totalupcomingscount = "/admin/dashboard/upcoming_events_count";
  static totalptivioscount = "/admin/dashboard/previous_events_count";
  static totaleventscount = "/admin/dashboard/total_events_count";
  static employeesrank = "/admin/dashboard/employeesrank";
  static cancel_events_count = "/admin/dashboard/cancel_events_count";
  static live_events_count = "/admin/dashboard/live_events_count";

  //Feedback and Elevate-forms
  static elevateFormList = "/elevateForms/elevateFormList";
  static feedbackList = "/feedback/feedbackList";
  static addElevateForms = "/elevateForms/addElevateForms";
  static editElevateForm = "/elevateForms/editElevateForm";
  static elevateFormById = "/elevateForms/elevateFormById";
  static deleteElevateFormById = "/elevateForms/deleteElevateFormById";

  //trainner module
  static hostlist = "/host/hostlist";
  static addTrainner = "/host/addhost";
  static hostDropdownList = "/host/hostDropdownList";
  static hostMyEvents = "/host/hostMyEvents";
  static hostAttendanceReport = "/host/hostAttendanceReport";
  static async makeAPICall({
    props,
    methodName,
    api_url,
    body,
    params,
    options,
  }) {
    api_url = this.API_URL + api_url;

    //request interceptor to add the auth token header to requests
    axios.interceptors.request.use(
      (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          config.headers = {
            accept: "application/json",
            "content-type": "application/json",
            authorization: "Bearer " + accessToken,
            platform: "web-admin",
            ...options
          };
        } else {
          config.headers = {
            accept: "application/json",
            "content-type": "application/json",
            platform: "web-admin",
            ...options
          };
        }
        return config;
      },
      (error) => {
        Promise.reject(error);
      }
    );
    //response interceptor to refresh token on receiving token expired error
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async function (error) {
        const originalRequest = error.config;
        let refreshToken = localStorage.getItem("refreshToken");
        if (
          refreshToken &&
          error?.response?.status === 401 &&
          !originalRequest._retry
        ) {
          if (originalRequest.url.includes("/refreshToken")) {
            return Promise.reject(error);
          }
          originalRequest._retry = true;
          try {
            const url = Service.API_URL + Service.refreshToken;
            const response = await axios.post(url, {
              refreshToken: refreshToken,
            });
            if (response.status === 200 && response.data.authToken) {
              localStorage.setItem(
                "accessToken",
                response.data.authToken.accessToken
              );
              localStorage.setItem(
                "refreshToken",
                response.data.authToken.refreshToken
              );
              console.log("Access token refreshed!");
              const res = await axios(originalRequest);
              return res;
            } else {
              console.log("Refresh Token Error", error);
              return Promise.reject(response);
            }
          } catch (e) {
            return Promise.reject(e);
          }
        } else {
          return Promise.reject(error);
        }
      }
    );

    if (methodName === this.getMethod) {
      if (params) {
        api_url = api_url + "?" + params;
      }
      try {
        const response = await axios.get(api_url);
        return response;
      } catch (error) {
        if (props && error.response && error.response.status === 401) {
          this.logOut(props);
        }
        return error.response;
      }
    }
    if (methodName === this.postMethod) {
      if (params) {
        api_url = api_url + "/" + params;
      }
      try {
        const response = await axios.post(api_url, body, options);
        return response;
      } catch (error) {

        if (props && error.response && error.response.status === 401) {
          this.logOut(props);
        }
        return error.response;
      }
    }
    if (methodName === this.putMethod) {
      if (params) {
        api_url = api_url + "/" + params;
      }
      try {
        const response = await axios.put(api_url, body, options);
        return response;
      } catch (error) {
        if (props && error.response && error.response.status === 401) {
          this.logOut(props);
        }
        return error.response;
      }
    }
    if (methodName === this.deleteMethod) {
      if (params) {
        api_url = api_url + "/" + params;
      }
      try {
        const response = await axios.delete(api_url, { data: body });
        return response;
      } catch (error) {
        if (props && error.response && error.response.status === 401) {
          this.logOut(props);
        }
        return error.response;
      }
    }
  }

  static logOut(props) {
    props.logOutHandler();
    props.history.push("/login");
  }

  static uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
