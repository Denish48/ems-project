import React, { useState, useEffect } from "react";
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
  Checkbox,
  Upload,
} from "antd";
import imageCompression from "browser-image-compression";
import Service from "../../service";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";

import MultiDatePicker from "react-multi-date-picker"
import DatePanel from "react-multi-date-picker/plugins/date_panel"
const { Option } = Select;
const AddEvent = (props) => {
  const [form] = Form.useForm();
  const [departmentList, setDepartmentList] = useState([]);
  const [positionlist, setpositionList] = useState([]);
  const [eventTypeList, setEventTypeList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const dispatch = useDispatch();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
console.log("venue_url",authUser.org_id._id);
  const [focusedDate, setFocusedDate] = useState();
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

  useEffect(() => {
    getDepartmentList();
    getEventTypeList();
    getEmployeeList();
    getpositionDropdownList()
  }, []);

  const getDepartmentList = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setDepartmentList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
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
  const getEventTypeList = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.eventTypeDropdownList,
      });
      if (response.data && response.data.data) {
        setEventTypeList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const disabledDate = (current) => {
    return current.isBefore(moment().subtract(1, 'day'));
  };
  const getEmployeeList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeesDropdownList,
      });
      if (response.data && response.data.data) {
        setEmployeeList(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const handleSubmit = async (values) => {
    console.log("values",values);
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
      console.log("values",values);
      if (!date_range || date_range.length === 0) {
        const msg = "Please select dates";
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
        org_id: authUser?.org_id?._id,
        user_id: authUser?._id,
      };
      // reqBody.event_name = reqBody.event_name.trim();
      // reqBody.venue = reqBody.venue.trim();
      // reqBody.description = reqBody.description.trim();
      if (time_range && time_range.length > 0) {
        reqBody.start_time = time_range[0].toISOString();
        reqBody.end_time = time_range[1].toISOString();
      } else {
        const new_date = new Date();
        reqBody.start_time = new_date.setHours(10, 0, 0, 0);
        reqBody.end_time = new_date.setHours(19, 0, 0, 0);
      }
      if (reqBody.custom_dates?.length > 0) {
        reqBody.custom_dates = reqBody.custom_dates.map(item => item.toDate())
      }
      if (reqBody.departments?.length > 0 && reqBody.departments[0] === 'all') {
        reqBody.departments = departmentList.map(item => item._id);
      }
      if (reqBody.designation?.length > 0 && reqBody.designation[0] === 'all') {
        reqBody.designation = positionlist.map(item => item._id);
      }  if (reqBody.host_users?.length > 0 && reqBody.host_users[0] === 'all') {
        reqBody.host_users = employeeList.map(item => item._id);
      }
      if (imageUrlArr && imageUrlArr.length > 0) {
        const event_image_arr = imageUrlArr.map((item) => item.compressedFile);
        for (let i = 0; i < event_image_arr.length; i++) {
          formData.append('event_image', event_image_arr[i]);
        }
      }
      for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }

      const options = {
        'content-type': 'multipart/form-data'
      }

      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.eventAdd,
        body: formData,
        options
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/event");
        message.success(response.data.message);
      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/event');
    }
  };

  const onReset = () => {
    form.resetFields();
    setFileList([]);
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
  const handleChange = async (info) => {
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
    multiple: true,
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
  const uploadButton = (
    <Upload {...uploaderProps}>
      {fileList.length < uploaderProps.maxCount && "+ Upload"}
    </Upload>
  );

  const validator = (rule, value) => {
    if (rule.field === 'event_name') {
      if (value && ! /^([0-9 \-]*$)[a-zA-Z0-9 \-\']+$/.test(value)) {
        return Promise.reject('Please enter valid event name!');
      } else {
        return Promise.resolve();
      }
    } else if (rule.field === 'event_type_id') {
      if (value && !/^([ A-Za-z0-9]{3,16})$/.test(value)) {
        return Promise.reject('Please enter valid event type!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'host_users') {
      if (value && !/^([ A-Za-z0-9]{3,16})$/.test(value)) {
        return Promise.reject('Please enter valid Trainer Name!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'departments') {
      if (value && !/^([ A-Za-z0-9]{3,16})$/.test(value)) {
        return Promise.reject('Please enter valid Department!');
      } else {
        return Promise.resolve();
      }
    }
    // else if (rule.field === 'event_seats') {
    //   if (value && !/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{50,}$/.test(value)) {
    //     return Promise.reject('Please enter valid event seats!');
    //   } else {
    //     return Promise.resolve();
    //   }
    // }

    else {
      return Promise.resolve();
    }
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
          const date = item.toDate();
          date.setHours(0, 0, 0, 0);
          return date >= start_time && date <= end_time;
        });
        form.setFieldsValue({ custom_dates: new_custom_dates })
      }
    }
  }

  return (
    <Card className="gx-card select-dates" title="Add Event">
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          allDay: true, isCustomDate: false, credit: 1, event_seats: 0,
          date_range: [moment(new Date()), moment(new Date().setDate(new Date().getDate() + 1))],
          time_range: [moment(new Date().setHours(10, 0, 0, 0)), moment(new Date().setHours(19, 0, 0, 0))],
          manual_users:[],
          host_users: [],
          designation:[],
          venue_url:""
        }}
      >
        <Form.Item
          label="Event Name"
          name="event_name"
          rules={[
            {
              required: true,
              message: "Please enter your Event Name",
            },
            // { validator: validator }
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
              message: "Please enter your Event type!",
            },
          ]}
        >
          <Select
            size="large"
            showSearch
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
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.event_type}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Host/Co-ordinator"
          name="host_users"
          rules={[
            {
              required: true,
              message: "Please enter your Trainer Name!",
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
              message: "Please enter your Department!",
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
            // getFieldValue
            onChange={handleSelectAll}
          >
            <Option key="all" value="all">ALL</Option>

            {departmentList.map((item, index) => (
              <>
                <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                  {item.department_name}
                </Option>

              </>
            ))}
            {/* {children} */}
          </Select>
        </Form.Item>
        <Form.Item
          label="Designation"
          name="designation"
        // rules={[
        //   {
        //     required: true,
        //     message: "Please enter your Department!",
        //   },
        // ]}
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
              message: "Please enter your Credit!",
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
              message: "Please enter your Event Seats!",
            },
            { validator: validator }
          ]}
        >
          <InputNumber onKeyDown={suppressInteger} type="number" min={0} size="large" />
        </Form.Item>

        <Form.Item
          label="Start Date and End Date"
          name="date_range"
          className="start-enddate"
          rules={[
            {
              required: true,
              message: "Please enter your Event Dates!",
            },
          ]}
        >
          <DatePicker.RangePicker onCalendarChange={onCalendarChange} disabledDate={disabledDate} />
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
                    message: "Please enter your Custom Dates!",
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
                      className=""
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
        <div>
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
              message: "Please enter your Venue Name!",
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
              message: "Please enter your Description!",
            },
          ]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="Photo"
          required={true}
          rules={[
            {
              required: true,
              message: "Please enter your Photo",
            },
            // { validator: validator }
          ]}>{uploadButton}</Form.Item>

        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button type="primary" onClick={onReset} style={{ marginLeft: '10px' }}>
            Reset
          </Button>
          <Button type="primary" onClick={onCancel} style={{ marginLeft: '10px' }}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddEvent;
