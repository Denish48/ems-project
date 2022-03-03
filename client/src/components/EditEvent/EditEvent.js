import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Select,
  Button,
  Input,
  DatePicker,
  TimePicker,
  InputNumber,
  message,
  Upload,
  Checkbox,
  Rate,
  Modal,
  Space
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from "react-redux";
import Service from "../../service";
import moment from "moment";
import ReactDOM from 'react-dom';
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import MultiDatePicker from "react-multi-date-picker"
import DatePanel from "react-multi-date-picker/plugins/date_panel"
import { Tabs } from 'antd';

import imageCompression from "browser-image-compression";
import $ from "jquery";
window.jQuery = $;
window.$ = $;

require("jquery-ui-sortable");
require("formBuilder");

const { Option } = Select;
const { TabPane } = Tabs;

const EditEvent = (props) => {

  const [form] = Form.useForm();
  const [form_event_notification] = Form.useForm();

  const id = props.match.params.id;
  const [eventApiData, setEventApiData] = useState(null);
  const [departmentList, setDepartmentList] = useState([]);
  const [eventTypeList, setEventTypeList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [focusedDate, setFocusedDate] = useState();
  const [feedbackData, setFeedbackData] = useState([])
  const [SurveyBy, setSurveyBy] = useState([])
  const [positionlist, setpositionList] = useState([]);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const fb = useRef();

  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [deleteUrlArr, setDeleteUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [eventFormData, setEventFormData] = useState(null);
  const [IsModalView, setIsModalView] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    getEventById();
    getDepartmentList();
    getEventTypeList();
    getEmployeeList();
    getElevateFormList();
    getpositionDropdownList();
  }, []);

  const getEventById = async () => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventById + params,
      });
      if (response.data && response.data.data) {
        setEventApiData(response.data.data);
        if (response.data.data.event_image && response.data.data.event_image.length > 0) {
          response.data.data.event_image.forEach((item, index) => {
            let url;
            if (item.includes('base64')) {
              url = item;
            } else {
              url = `${Service.Server_Base_URL}/uploads/event_images/${item}`
            }
            const file = {
              uid: Service.uuidv4(),
              name: item,
              status: 'done',
              url
            };
            fileList.push(file);
            if (index === response.data.data.event_image.length - 1) {
              setFileList([...fileList]);
            }
          });
        }
      } else {
        props.history.push('/event');
      }
      if (response.data.event_form_id) {
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getpositionDropdownList = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.designationDropdownList,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        console.log("response.data.data position", response.data.data);
        setpositionList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const getDepartmentList = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      if (response.data && response.data.data) {
        setDepartmentList(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getEventTypeList = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventTypeDropdownList,
      });
      if (response.data && response.data.data) {
        const evntType = response.data.data;
        setEventTypeList(evntType);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getEmployeeList = async (values) => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeesDropdownList,
      });
      if (response.data && response.data.data) {
        setEmployeeList(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
  };
  const handleUpdate = async (values) => {
    try {
      if (fileList.length === 0) {
        const msg = "Please provide at least one image";
        const index = Service.add_message(msg);
        if (index === -1) {
          message.error(msg).then(() => {
            Service.remove_message(msg);
          });
        }
        return;
      }
      const { date_range, time_range, ...rest } = values;
      if (!date_range || date_range.length === 0) {
        const msg = 'Please select dates';
        const index = Service.add_message(msg);
        if (index === -1) {
          message.error(msg).then(() => {
            Service.remove_message(msg);
          });
        }
        return;
      }
      const formData = new FormData();
      const start_date = date_range[0].toISOString();
      const end_date = date_range[1].toISOString();
      const reqBody = {
        ...rest,
        start_date,
        end_date,
        user_id: authUser?._id,
      };
      if (time_range && time_range.length > 0) {
        reqBody.start_time = time_range[0].toISOString();
        reqBody.end_time = time_range[1].toISOString();
      } else {
        const new_date = new Date();
        reqBody.start_time = new_date.setHours(10, 0, 0, 0);
        reqBody.end_time = new_date.setHours(19, 0, 0, 0);
      }

      if (reqBody.custom_dates?.length > 0) {
        reqBody.custom_dates = reqBody.custom_dates.map(item => {
          if (typeof item === 'string') {
            return item
          }
          else {
            return item?.toDate().toISOString()
          }
        })
      }
      if (imageUrlArr && imageUrlArr.length > 0) {
        const event_image_arr = imageUrlArr.map((item) => item.compressedFile);
        for (let i = 0; i < event_image_arr.length; i++) {
          formData.append('event_image', event_image_arr[i]);
        }
      }
      if (deleteUrlArr && deleteUrlArr.length > 0) {
        reqBody.remove_event_images = deleteUrlArr;
      }
      if (reqBody.departments.length > 0 && reqBody.departments[0] === 'all') {
        reqBody.departments = departmentList.map(item => item._id);
      }
      if (reqBody.designation.length > 0 && reqBody.designation[0] === 'all') {
        reqBody.designation = positionlist.map(item => item._id);
      }
      for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }
      // formData.forEach((value, key) => {
      //   console.log(key, value);
      // });
      const options = {
        'content-type': 'multipart/form-data'
      }
      const params = `/${id}`;
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.editEvent + params,
        body: formData,
        options
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push('/event');
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }
  };


  const getCompressedFile = async (imageFile) => {
    const options = {
      maxSizeMB: 5,
      useWebWorker: true,
    };
    console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  };

  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === "image/jpg" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLtM = file.size / 1024 / 1024 < 10;
    if (!isLtM) {
      message.error("Image must smaller than 10MB!");
    }
    return isJpgOrPng;
  };
  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      info.file.status = "done";
    }
    if (info.file.status === "done") {
      setFileList(info.fileList);
    }
  };

  const uploaderProps = {
    name: "file",
    listType: "picture-card",
    accept: "image/*",
    maxCount: 1,
    fileList: fileList,
    beforeUpload: beforeUpload,
    onChange: handleChange,
    customRequest: async ({ onSuccess, onError, file }) => {
      const compressedFile = await getCompressedFile(file);
      imageUrlArr.push({
        file,
        compressedFile: compressedFile,
      });
      setImageUrlArr([...imageUrlArr]);
      onSuccess("ok");
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      if (fileList[index].url?.includes('uploads')) {
        setDeleteUrlArr([...deleteUrlArr, fileList[index].name]);
      }
      const index_2 = imageUrlArr.findIndex(
        (item) => item.file?.uid === file.uid || item.uid === file.uid
      );
      if (index_2 > -1) {
        imageUrlArr.splice(index_2, 1);
        setImageUrlArr([...imageUrlArr]);
      }
      fileList.splice(index, 1);
      setFileList([...fileList]);
    },
  };

  const uploadButton = (
    <Upload {...uploaderProps}>
      {fileList.length < uploaderProps.maxCount && "+ Upload"}
    </Upload>
  );
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event');
    }
  };
  function callback(key) {
    setActiveTab(key);
    if (key === '2') {
      if (eventApiData?.event_form_id) {
        getEventFormData(eventApiData?.event_form_id)
      } else if (SurveyBy && SurveyBy.length === 0) {
        setIsModalView(true);
      }
    }
  }

  const getEventFormData = async (id) => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.getEventForm + params,
      });
      if (response.data && response.data.data) {
        const questions = response.data?.data?.questions
        setEventFormData(questions);
        $(fb.current).formBuilder({ formData: questions, ...options });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
  }, [eventFormData]);

  const handleSubmit = async (questions) => {
    try {
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.saveEventForm,
        body: {
          questions,
          event_id: id,
          user_id: authUser?._id,
          org_id: authUser?.org_id._id,
        },
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        if (props.history.length > 1) {
          props.history.goBack();
        } else {
          props.history.push('/event');
        }
      }
    } catch (e) {
      dispatch(hideAuthLoader());
      console.log("err occured:" + e);
    }
  };
  const onSave = (e, values) => {
    if (values) {
      setEventFormData(JSON.parse(values));
      handleSubmit(JSON.parse(values));
      setIsModalView(false);
    }
  }

  const getElevateFormList = async (values) => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.elevateFormList,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const FeedBackData = response.data.data
        setFeedbackData(FeedBackData);
        $(fb.current).formBuilder({ formData: FeedBackData, ...options });

      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const getElevateFormById = async (value) => {
    const { elevate_form } = value
    try {
      // dispatch(showAuthLoader());
      const params = `/${elevate_form}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.elevateFormById + params,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        const questions = response.data?.data?.survey_questions
        setSurveyBy(questions);
        $(fb.current).formBuilder({ formData: questions, ...options });
        setIsModalView(false);

      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const options = {
    stickyControls: {
      enable: true,
    },
    sortableControls: true,
    onSave,
    disableFields: ['autocomplete', 'date', 'file', 'hidden',],
    fields: [{
      label: 'Star Rating',
      attrs: {
        type: 'starRating'
      },
      icon: '🌟'
    }],
    templates: {
      starRating: function (fieldData) {
        return {
          field: '<span id="' + fieldData.name + '">',
          onRender: function () {
            ReactDOM.render(
              <Rate />,
              document.getElementById(fieldData.name)
            );
          }
        };
      }
    },
    inputSets: [
      {
        label: 'User Details',
        name: 'user-details', // optional - one will be generated from the label if name not supplied
        showHeader: true, // optional - Use the label as the header for this set of inputs
        fields: [
          {
            type: 'text',
            label: 'First Name',
            className: 'form-control'
          },
          {
            type: 'text',
            label: 'Last Name',
            className: 'form-control'
          },
          {
            type: 'textarea',
            label: 'Description',
            className: 'form-control'
          }
        ]
      },
      {
        label: 'Event Statisfaction',
        fields: [
          {
            "type": "starRating",
            "required": false,
            "label": "Rating",
            "name": "statisfaction-starRating-0",
            "access": false
          },
        ]
      },
      {
        label: 'User Agreement',
        fields: [
          {
            type: 'header',
            subtype: 'h2',
            label: 'Terms &amp; Conditions',
            className: 'header'
          },
          {
            type: 'paragraph',
            label: 'Lorem ipsum',
          },
          {
            type: 'checkbox-group',
            label: 'Do you agree to the terms and conditions?',
          }
        ]
      },
      {
        label: 'Anonymous Feedback',
        fields: [
          {
            type: 'checkbox-group',
            label: 'Do you want to submit as anonymous feedaback?',
            name: "anonymous-feedback-0",
          }
        ]
      }
    ],
  };

  const handleSelectAll = (value) => {
    if (value && value.length && value.includes("all")) {
      if (value.length === departmentList.length + 1) {
        return [];
      }
      return [...departmentList];
    }
    return value;
  }
  const designationSelectAll = (value) => {
    if (value && value.length && value.includes("all")) {
      if (value.length === positionlist.length + 1) {
        return [];
      }
      return [...positionlist];
    }
    return value;
  }
  // const setEventInterval = (e) => {
  //   const new_date = new Date();
  //   if (!e.target.checked) {
  //     const time_range = [moment(new_date.setHours(new_date.getHours(), 0, 0, 0)), moment(new_date.setHours(new_date.getHours() + 1, 0, 0, 0))];
  //     form.setFieldsValue({
  //       time_range
  //     });
  //   }
  // }

  const onFinish = async (values) => {
    try {
      console.log('values', values);
      const params = `/${id}`;
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.putMethod,
        api_url: Service.saveEventNotification + params,
        body: values,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push('/event');
        message.success(response.data.message)
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const durationArr = ['hours', 'minutes', 'days'];

  if (!eventApiData) {
    return null;
  }

  const suppressInteger = (e) => {
    var key = e.charCode || e.keyCode || 0;

    if (key === 8 ||
      key === 9 ||
      key === 46 ||
      (key >= 35 && key <= 40) ||
      (key >= 48 && key <= 57) ||
      (key >= 96 && key <= 105)) {
      return true;
    } else {
      e.preventDefault();
      return false;
    }
  }

  const onCalendarChange = (value) => {

    const date_range = value;
    if (date_range && date_range.length > 1 && date_range[0] && date_range[1]) {
      let start_time = date_range[0].toDate();
      let end_time = date_range[1].toDate();
      start_time.setHours(0, 0, 0, 0);
      end_time.setHours(0, 0, 0, 0);
      const custom_dates = form.getFieldValue('custom_dates');
      if (custom_dates?.length > 0) {
        const new_custom_dates = custom_dates.filter(item => {
          console.log("item", item);
          let date = item;
          if (typeof item === "string") {
            date = new Date(date)
          } else {
            date = item.toDate();
          }
          date.setHours(0, 0, 0, 0);
          return date >= start_time && date <= end_time;
        });
        form.setFieldsValue({ custom_dates: new_custom_dates })
      }
    }
  }

  return (
    <>
      <Tabs activeKey={activeTab} defaultActiveKey="1" onChange={callback}>
        <TabPane tab="Edit Event" key="1">
          <Card className="gx-card select-dates" title="Edit Event">
            <Form
              layout="vertical"
              {...formItemLayout}
              name="eventForm"
              form={form}
              onFinish={handleUpdate}
              initialValues={{
                ...eventApiData,
                event_type_id: eventApiData.event_type_id?._id,
                designation: eventApiData?.designation,
                departments:
                  eventApiData.departments &&
                    Array.isArray(eventApiData.departments) &&
                    eventApiData.departments?.length > 0
                    ? eventApiData.departments.map((item) => item._id)
                    : undefined,
                    host_users: eventApiData?.host_users.map(
                      (usr) => usr?._id
                    ),
                    manual_users: eventApiData?.manual_users.map(
                      (emp) => emp?._id),
                    designation: eventApiData?.designation,

                // eventApiData.designation &&
                //   Array.isArray(eventApiData.designation) &&
                //   eventApiData.designation?.length > 0
                //   ? eventApiData.designation.map((item) => item._id)
                //   : undefined,
                date_range:
                  eventApiData.start_date && eventApiData.end_date
                    ? [moment(eventApiData.start_date), moment(eventApiData.end_date)]
                    : [moment(new Date()), moment(new Date().setDate(new Date().getDate() + 1))],
                time_range:
                  eventApiData.start_time && eventApiData.end_time
                    ? [moment(eventApiData.start_time), moment(eventApiData.end_time)]
                    : [moment(new Date().setHours(10, 0, 0, 0)), moment(new Date().setHours(19, 0, 0, 0))],
                allDay: typeof eventApiData.allDay === 'boolean' ? eventApiData.allDay : true,
                isCustomDate: typeof eventApiData.isCustomDate !== 'undefined' ? eventApiData.isCustomDate : false,
                credit: typeof eventApiData.credit !== 'undefined' ? eventApiData.credit : 1,
                event_seats: typeof eventApiData.event_seats !== 'undefined' ? eventApiData.event_seats : 50,
                venue_url: eventApiData.venue_url
              }}
            >
              <Form.Item
                label="Event Name"
                name="event_name"
                rules={[
                  {
                    required: true,
                    message: "Please input your Event Name",
                  },
                ]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                label="Event Type"
                name="event_type_id"
                rules={[
                  {
                    required: true,
                    message: "Please input your Event type!",
                  },
                ]}
              >
                <Select
                  size="large"
                  showSearch
                  // optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {eventTypeList.map((item, index) => (
                    <Option key={index} value={item._id}>
                      {item.event_type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="Host Name"
                name="host_users"
                rules={[
                  {
                    required: true,
                    message: "Please input your Trainer Name!",
                  },
                ]}
              >
                <Select
                  size="large"
                  showSearch
                  mode="multiple"
                  // optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {employeeList.map((item, index) => (
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.first_name + " " + item.last_name}
              </Option>
            ))}
                </Select>
              </Form.Item>



              <Form.Item
                label="Manual Users"
                name="manual_users"

              >
                <Select
                  size="large"
                  showSearch
                  mode="multiple"

                  // optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {employeeList.map((item, index) => (
                    <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                      {item.first_name + " " + item.last_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>



              <Form.Item
                label="Department"
                name="departments"
                rules={[
                  {
                    required: true,
                    message: "Please input your DepartMent!",
                  },
                ]}
              >
                <Select
                  size="large"
                  mode="multiple"
                  showSearch
                  // optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                  onChange={handleSelectAll}

                >
                  <Option key="all" value="all">ALL</Option>
                  {departmentList.map((item, index) => (
                    <Option key={index} value={item._id}>
                      {item.department_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Designation"
                name="designation"

              >
                <Select
                  size="large"
                  mode="multiple"
                  showSearch
                  // optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                  // getFieldValue
                  onChange={designationSelectAll}
                >
                  <Option key="all" value="all">ALL</Option>

                  {positionlist.map((item, index) => (
                    <>
                      <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                        {item.designation_name}
                      </Option>

                    </>
                  ))}
                  {/* {children} */}
                </Select>
              </Form.Item>


              <Form.Item
                label="Credit"
                name="credit"
                rules={[
                  {
                    required: true,
                    message: "Please input your Credit!",
                  },
                ]}
              >
                <InputNumber onKeyDown={suppressInteger} type="number" min={1} size="large" />
              </Form.Item>

              <Form.Item
                label="Event Seats"
                name="event_seats"
                rules={[
                  {
                    required: true,
                    message: "Please input your Event Seats!",
                  },
                ]}
              >
                <InputNumber onKeyDown={suppressInteger} type="number" min={0} size="large" />
              </Form.Item>

              <Form.Item
                label="Start Date and End Date"
                name="date_range"
                rules={[
                  {
                    required: true,
                    message: "Please input your event dates!",
                  },
                ]}
              >
                <DatePicker.RangePicker onCalendarChange={onCalendarChange} />
              </Form.Item>
              <div >
                <Form.Item
                  name="isCustomDate"
                  valuePropName="checked"
                  wrapperCol={{ offset: 8, span: 16 }}
                >
                  <Checkbox>Set Specific dates</Checkbox>
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.isCustomDate !== currentValues.isCustomDate ||
                    prevValues.date_range !== currentValues.date_range
                  }
                >
                  {({ getFieldValue }) => getFieldValue("isCustomDate") === true &&
                    getFieldValue("date_range")?.length === 2 ?
                    <Form.Item
                      label="Select your event's Custom dates"
                      name="custom_dates"
                      rules={[
                        {
                          required: true,
                          message: "Please input your event dates!",
                        },
                      ]}
                    >
                      <MultiDatePicker
                        multiple
                        sort
                        header="Events Dates"
                        minDate={getFieldValue('date_range')?.length > 0 ? getFieldValue('date_range')[0].toISOString() : undefined}
                        maxDate={getFieldValue('date_range')?.length > 0 ? getFieldValue('date_range')[1].toISOString() : undefined}
                        onFocusedDateChange={setFocusedDate}
                        onClose={() => setFocusedDate(undefined)}
                        plugins={[
                          <DatePanel markFocused focusedClassName="bg-red"
                            style={{
                              color: "black"
                            }}
                          />
                        ]}
                        mapDays={({ date, isSameDate }) => {
                          let props = {}
                          if (!isSameDate(date, focusedDate)) return
                          props.style = { backgroundColor: "red" }
                          return props
                        }}
                      />
                    </Form.Item>
                    : null
                  }
                </Form.Item>
              </div>
              <div >
                <Form.Item
                  name="allDay"
                  valuePropName="checked"
                  wrapperCol={{ offset: 8, span: 16 }}
                >
                  <Checkbox>All Day Event</Checkbox>
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.allDay !== currentValues.allDay
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("allDay") === true ? null : (
                      <Form.Item label="Start Time and End Time" name="time_range"
                        required={typeof getFieldValue("allDay") === 'undefined' ||
                          getFieldValue("allDay") === null ||
                          getFieldValue("allDay") === false}>
                        <TimePicker.RangePicker format="HH:mm" />
                      </Form.Item>
                    )
                  }
                </Form.Item>
              </div>

              <Form.Item
                label="Venue Name"
                name="venue"
                rules={[
                  {
                    required: true,
                    message: "Please input your Venue Name!",
                  },
                ]}
              >
                <Input size="large" />
              </Form.Item>
              <Form.Item
                label="Venue URL"
                name="venue_url"

              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  {
                    required: true,
                    message: "Please input your description!",
                  },
                ]}
              >
                <Input.TextArea />
              </Form.Item>
              <Form.Item label="Photo">{uploadButton}</Form.Item>
              {
                <Form.Item {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                  {/* <Button type="primary" onClick={onReset}>
                    Reset
                  </Button> */}
                  <Button type="primary" onClick={onCancel} style={{ marginLeft: '10px' }}>
                    Back
                  </Button>
                </Form.Item>
              }
            </Form>
          </Card>
        </TabPane>
        <TabPane tab="Feedback Settings" key="2">
          <Card className="gx-card" title="Feedback">
            <div
              id="fb-editor"
              ref={fb}
            />
            <Button type="primary" onClick={onCancel}>
              Back
            </Button>
            <Modal
              width={800}
              visible={IsModalView}
              okText="Submit"
              onCancel={() => {
                setActiveTab('1');
                setIsModalView(false);
              }}
              footer={false}
              closable={false}
            >
              <Card className="gx-card" title="Setup Event Form">
                <Form
                  layout="vertical"
                  {...formItemLayout}
                  name="elevateForm"
                  onFinish={getElevateFormById}
                // initialValues={{ survey_name: surveyName }}
                >
                  <Form.Item
                    label="Select Elevate Form Template"
                    name="elevate_form"
                    rules={[
                      {
                        required: true,
                        message: "Please select elevate form template!",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                    >
                      {feedbackData.map((item, index) => (
                        <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                          {item?.survey_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Next</Button>
                </Form>
              </Card>
            </Modal>
          </Card>
        </TabPane>
        <TabPane tab="Notification Settings" key="3">
          <Card className="gx-card" title="Notification">
            <Form
              layout="vertical"
              name="form_event_notification"
              form={form_event_notification}
              onFinish={onFinish}
              initialValues={
                eventApiData.event_notification_list?.length > 0 ?
                  { event_notification_list: eventApiData.event_notification_list }
                  : {
                    event_notification_list: [{
                      duration_type: 'minutes',
                      duration: 10
                    }]
                  }
              }>
              <Form.List name="event_notification_list">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(field => (
                      <Space key={field.key} align="baseline">
                        <Form.Item
                          {...field}
                          label="Duration"
                          name={[field.name, 'duration']}
                          fieldKey={[field.fieldKey, 'duration']}
                          rules={[{ required: true, message: 'Missing duration' }]}
                        >
                          <InputNumber min={10} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          label="Duration Type"
                          name={[field.name, 'duration_type']}
                          fieldKey={[field.fieldKey, 'duration_type']}
                          rules={[{ required: true, message: 'Missing duration type' }]}
                        >
                          <Select style={{ width: 130 }}>
                            {durationArr.map((item, index) => (
                              <Option key={index} value={item}>
                                {item}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Notification
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button type="primary" onClick={onCancel} style={{ marginLeft: '10px' }}>
                  Back
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </>
  );
};

export default EditEvent;
