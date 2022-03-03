import React, { useEffect, useState } from "react";
import { Card, Form, Select, Button, Input, message, Upload, DatePicker } from "antd";
import {
  showAuthLoader,
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import { useDispatch, useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import Service from "../../service";
import moment from "moment";
const { Option } = Select;
const AddEmployee = (props) => {
  const dispatch = useDispatch();
  const [departmentList, setDepartmentList] = useState([]);
  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [positionlist, setpositionList] = useState([]);
  const [fileList, setFileList] = useState([]); const [form] = Form.useForm();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );

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
    getpositionDropdownList();
  }, []);


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

  const handleSubmit = async (values, e) => {
    try {
      // dispatch(showAuthLoader());
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
      const formData = new FormData();
      const reqBody = {
        ...values,
        org_id: authUser?.org_id._id,
        user_id: authUser?._id,
      };
      if (imageUrlArr && imageUrlArr.length > 0) {
        const user_image_arr = imageUrlArr.map((item) => item.compressedFile);
        formData.append('user_img', user_image_arr[0]);
      }
      for (var key in reqBody) {
        if (reqBody[key] && Array.isArray(reqBody[key])) {
          formData.append(`${key}[]`, reqBody[key]);
        } else {
          formData.append(key, reqBody[key]);
        }
      }
      dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.addEmployees,
        body: formData,
      });
      dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        props.history.push("/employee");
        message.success(response.data.message)

      }
      else {
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const getDepartmentList = async (values) => {
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
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/employee');
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
      message.error("You can only upload JPG/PNG/JPEG file!");
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
  const uploadButton = (
    <Upload {...uploaderProps}>
      {fileList.length < uploaderProps.maxCount && "+ Upload"}
    </Upload>
  );

  const validator = (rule, value) => {
    if (rule.field === 'first_name') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid first name!');
      } else {
        return Promise.resolve();
      }
    } else if (rule.field === 'last_name') {
      if (value && !/^[^-\s][a-zA-Z0-9_\s-]+$/.test(value)) {
        return Promise.reject('Please enter valid last name!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'email') {
      if (value && !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)) {
        return Promise.reject('Please enter valid email!');
      } else {
        return Promise.resolve();
      }
    }
    else if (rule.field === 'phone_number') {
      if (value && ! /^(\+\d{1,3}[- ]?)?\d{10}$/.test(value)) {
        return Promise.reject('Please enter valid Phone number!');
      } else {
        return Promise.resolve();
      }
    }

    else {
      return Promise.resolve();
    }
  }
  function onChange(date, dateString) {
    console.log(date, dateString);
  }
  const disabledDate = (current) => {
    return current.isAfter(moment().subtract(1, 'day'));
  };
  return (
    <Card className="gx-card" title="Add Employee">
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Employee First Name"
          name="first_name"
          rules={[
            {
              required: true,
              message: "Please enter your First Name",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Employee Last Name"
          name="last_name"
          rules={[
            {
              required: true,
              message: "Please enter your Last Name",
            },
            { validator: validator }
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Employee Birthdate"
          name="birthdate"
          rules={[
            {
              required: true,
              message: "Please enter your Event Dates!",
            },
          ]}
        >
          <DatePicker disabledDate={disabledDate} />
        </Form.Item>

        {/* <Form.Item
          label="Employee Birth-Date"
          name="birthdate"
          rules={[
            {
              required: true,
              message: "Please enter your Employee Birth-Date",
            },
          ]}
        >
          <Input size="large" type="date" />
        </Form.Item>
        */}
        <Form.Item
          label="Employee Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please enter your Email Address",
            },
            {
              type: "email",
              message: 'Please enter valid Email Address',
            }
          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Department"
          name="department_id"
          rules={[
            {
              required: true,
              message: "Please enter your DepartMent!",
            },
          ]}
        >
          <Select size="large" showSearch
            // optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }>
            {departmentList.map((item, index) => (
              <Option key={index} value={item._id} style={{ textTransform: "capitalize" }}>
                {item.department_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Contact Number"
          name="phone_number"
          rules={[
            {
              required: true,
              message: "Please enter your Contact Number!",
            },
            { validator: validator }

          ]}
        >
          <Input size="large" />
        </Form.Item>
        <Form.Item
          label="Designation"
          name="designation_id"
          rules={[
            {
              required: true,
              message: "Please enter your designation!",
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
          // getFieldValue
          >
            {/* <Option key="all" value="all">ALL</Option> */}

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


        <Form.Item label="Photo" required={true}>{uploadButton}</Form.Item>


        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button type="primary" onClick={onCancel} style={{ marginLeft: '10px' }}>
            Back
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddEmployee;
